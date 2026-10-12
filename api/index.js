// Vercel serverless function: every /api/* request is rewritten here (see vercel.json).
import { route } from '../lib/api.js';

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const path = url.searchParams.get('__path') ?? url.pathname;
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { status, body: out } = await route(req.method, path, body || {}, req.headers);
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(out);
}
