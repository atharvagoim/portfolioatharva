// Storage: MongoDB when MONGODB_URI is set (required on Vercel).
// For local dev without a database, falls back to .data/db.json.
import crypto from 'node:crypto';
import { DEFAULT_SETTINGS, DEFAULT_PROJECTS } from './seed.js';

export const newId = () => crypto.randomBytes(9).toString('base64url');
const seedProjects = () => DEFAULT_PROJECTS.map((p, i) => ({ ...p, id: newId(), order: i, createdAt: Date.now() }));
const clean = (d) => { if (!d) return d; const { _id, ...rest } = d; return rest; };

/* ---------------- MongoDB ---------------- */
let mongoPromise = globalThis.__pfMongo; // reuse across warm serverless invocations
async function mongo() {
  if (!mongoPromise) {
    const { MongoClient } = await import('mongodb');
    mongoPromise = globalThis.__pfMongo = new MongoClient(process.env.MONGODB_URI).connect().then(async (client) => {
      const db = client.db(process.env.MONGODB_DB || 'portfolio');
      const settings = db.collection('settings');
      const projects = db.collection('projects');
      if (!(await settings.findOne({ _id: 'site' }))) {
        await settings.insertOne({ _id: 'site', ...DEFAULT_SETTINGS });
        if ((await projects.countDocuments()) === 0) await projects.insertMany(seedProjects());
      }
      await projects.createIndex({ id: 1 }, { unique: true });
      return { settings, projects };
    }).catch((e) => { mongoPromise = globalThis.__pfMongo = null; throw e; });
  }
  return mongoPromise;
}

const mongoDriver = {
  name: 'mongodb',
  async getSettings() { const { settings } = await mongo(); return clean(await settings.findOne({ _id: 'site' })); },
  async saveSettings(s) { const { settings } = await mongo(); await settings.replaceOne({ _id: 'site' }, { _id: 'site', ...s }, { upsert: true }); return s; },
  async listProjects() { const { projects } = await mongo(); return (await projects.find().sort({ order: 1 }).toArray()).map(clean); },
  async createProject(p) { const { projects } = await mongo(); await projects.insertOne({ ...p }); return p; },
  async updateProject(id, patch) {
    const { projects } = await mongo();
    const { id: _x, ...rest } = patch;
    await projects.updateOne({ id }, { $set: rest });
    return clean(await projects.findOne({ id }));
  },
  async deleteProject(id) { const { projects } = await mongo(); return (await projects.deleteOne({ id })).deletedCount > 0; },
  async reorder(ids) {
    const { projects } = await mongo();
    if (ids.length) await projects.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { id }, update: { $set: { order: i } } } })));
  },
};

/* ---------------- local JSON file (dev only) ---------------- */
function fileDriver() {
  let cache = null;
  const file = async () => {
    const path = await import('node:path');
    return path.join(process.cwd(), '.data', 'db.json');
  };
  const load = async () => {
    if (cache) return cache;
    const fs = await import('node:fs/promises');
    try { cache = JSON.parse(await fs.readFile(await file(), 'utf8')); }
    catch {
      cache = { settings: DEFAULT_SETTINGS, projects: seedProjects() };
      if (!process.env.VERCEL) await save(); // on Vercel without a DB: serve seed content read-only
    }
    return cache;
  };
  const guard = () => {
    if (process.env.VERCEL) {
      const e = new Error('No database configured. Add MONGODB_URI in your Vercel project settings to save changes.');
      e.status = 503; throw e;
    }
  };
  const save = async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const f = await file();
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(f, JSON.stringify(cache, null, 2));
  };
  return {
    name: 'file',
    async getSettings() { return (await load()).settings; },
    async saveSettings(s) { guard(); const db = await load(); db.settings = s; await save(); return s; },
    async listProjects() { return [...(await load()).projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); },
    async createProject(p) { guard(); const db = await load(); db.projects.push(p); await save(); return p; },
    async updateProject(id, patch) {
      guard(); const db = await load(); const i = db.projects.findIndex((p) => p.id === id);
      if (i < 0) return null; db.projects[i] = { ...db.projects[i], ...patch, id }; await save(); return db.projects[i];
    },
    async deleteProject(id) {
      guard(); const db = await load(); const n = db.projects.length;
      db.projects = db.projects.filter((p) => p.id !== id); await save(); return db.projects.length < n;
    },
    async reorder(ids) {
      guard(); const db = await load();
      ids.forEach((id, i) => { const p = db.projects.find((x) => x.id === id); if (p) p.order = i; });
      await save();
    },
  };
}

let fileStore;
export const getStore = () => (process.env.MONGODB_URI ? mongoDriver : (fileStore ??= fileDriver()));
