// All API routes in one framework-free handler.
// Used by the Vercel function (api/index.js) and by Vite's dev server.
import crypto from 'node:crypto';
import { getStore, newId } from './store.js';

const PIN = () => process.env.ADMIN_PIN || 'admin123';
const SECRET = () => process.env.AUTH_SECRET || crypto.createHash('sha256').update('pf:' + PIN()).digest('hex');
const TTL = 1000 * 60 * 60 * 24 * 7;

const sign = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${crypto.createHmac('sha256', SECRET()).update(body).digest('base64url')}`;
};
const verify = (token) => {
  if (!token?.includes('.')) return false;
  const [body, sig] = token.split('.');
  const exp = crypto.createHmac('sha256', SECRET()).update(body).digest('base64url');
  if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return false;
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > Date.now(); } catch { return false; }
};
const safeEq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

const FIELDS = ['title', 'tagline', 'description', 'category', 'tags', 'year', 'accent', 'featured', 'hidden', 'icon', 'logo', 'cover', 'liveUrl', 'repoUrl'];
const pick = (b = {}) => {
  const o = {};
  for (const k of FIELDS) if (k in b) o[k] = b[k];
  if (typeof o.tags === 'string') o.tags = o.tags.split(',').map((s) => s.trim()).filter(Boolean);
  if ('title' in o) o.title = String(o.title).trim().slice(0, 120);
  return o;
};

const fails = new Map(); // light brute-force guard (per warm instance)

/** route(method, path, body, headers) -> { status, body } */
export async function route(method, path, body = {}, headers = {}) {
  const store = getStore();
  const authed = () => verify(String(headers.authorization || '').replace(/^Bearer\s+/i, ''));
  const p = '/' + String(path || '').replace(/^\/?(api\/)?/, '').replace(/\/$/, '');

  try {
    if (method === 'GET' && p === '/health') return ok({ ok: true, storage: store.name });

    if (method === 'GET' && p === '/site') {
      const [settings, projects] = await Promise.all([store.getSettings(), store.listProjects()]);
      return ok({ settings, projects: projects.filter((x) => !x.hidden) });
    }

    if (method === 'POST' && p === '/auth/login') {
      const ip = String(headers['x-forwarded-for'] || 'local').split(',')[0];
      const f = fails.get(ip) || { n: 0, until: 0 };
      if (f.until > Date.now()) return err(429, 'Too many attempts. Try again in a minute.');
      if (!safeEq(String(body.pin || ''), PIN())) {
        f.n += 1; if (f.n >= 5) { f.n = 0; f.until = Date.now() + 60_000; }
        fails.set(ip, f);
        return err(401, 'Wrong PIN');
      }
      fails.delete(ip);
      return ok({ token: sign({ role: 'admin', exp: Date.now() + TTL }) });
    }

    // ---- everything below needs a valid token ----
    if (!authed()) return err(401, 'Unauthorized');

    if (method === 'GET' && p === '/auth/me') return ok({ ok: true });
    if (method === 'GET' && p === '/admin/projects') return ok(await store.listProjects());

    if (method === 'POST' && p === '/admin/projects') {
      const data = pick(body);
      if (!data.title) return err(400, 'Title is required');
      const all = await store.listProjects();
      const proj = {
        tagline: '', description: '', category: '', tags: [], year: String(new Date().getFullYear()), accent: '#B9B4F0',
        featured: false, hidden: false, icon: '', logo: '', cover: '', liveUrl: '', repoUrl: '',
        ...data, id: newId(), order: all.length, createdAt: Date.now(),
      };
      return ok(await store.createProject(proj), 201);
    }

    if (method === 'POST' && p === '/admin/projects/reorder') {
      if (!Array.isArray(body.ids)) return err(400, 'ids[] required');
      await store.reorder(body.ids);
      return ok({ ok: true });
    }

    const m = p.match(/^\/admin\/projects\/([\w-]+)$/);
    if (m && method === 'PUT') {
      const proj = await store.updateProject(m[1], pick(body));
      return proj ? ok(proj) : err(404, 'Not found');
    }
    if (m && method === 'DELETE') {
      return (await store.deleteProject(m[1])) ? ok({ ok: true }) : err(404, 'Not found');
    }

    if (method === 'PUT' && p === '/admin/settings') {
      const cur = await store.getSettings();
      const next = {
        ...cur, ...body,
        contacts: { ...(cur.contacts || {}), ...(body.contacts || {}) },
        experience: Array.isArray(body.experience) ? body.experience : cur.experience || [],
      };
      return ok(await store.saveSettings(next));
    }

    return err(404, 'Not found');
  } catch (e) {
    console.error(e);
    return err(e.status || 500, e.status ? e.message : 'Server error');
  }
}

const ok = (body, status = 200) => ({ status, body });
const err = (status, error) => ({ status, body: { error } });
