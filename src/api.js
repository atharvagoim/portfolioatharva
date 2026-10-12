// Same-origin API: Vercel functions in production, Vite middleware in dev.
const TOKEN_KEY = 'pf_admin_token';

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} };

async function req(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = `Bearer ${getToken()}`;
  const payload = body ? JSON.stringify(body) : undefined;
  if (payload && payload.length > 4_000_000) throw new Error('Images are too large to save in one go (Vercel limit ~4.5 MB). Use smaller images or remove the cover.');
  const res = await fetch(path, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth) {
      // token expired or PIN/secret changed: drop it and send the admin back to the login screen
      setToken(null);
      window.dispatchEvent(new Event('pf:logout'));
    }
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  site: () => req('/api/site'),
  login: (pin) => req('/api/auth/login', { method: 'POST', body: { pin } }),
  me: () => req('/api/auth/me', { auth: true }),
  projects: () => req('/api/admin/projects', { auth: true }),
  createProject: (p) => req('/api/admin/projects', { method: 'POST', body: p, auth: true }),
  updateProject: (id, p) => req(`/api/admin/projects/${id}`, { method: 'PUT', body: p, auth: true }),
  deleteProject: (id) => req(`/api/admin/projects/${id}`, { method: 'DELETE', auth: true }),
  reorder: (ids) => req('/api/admin/projects/reorder', { method: 'POST', body: { ids }, auth: true }),
  saveSettings: (s) => req('/api/admin/settings', { method: 'PUT', body: s, auth: true }),
};
