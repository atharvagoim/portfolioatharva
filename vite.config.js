import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Runs the same /api code Vercel runs, inside the Vite dev server.
// So `npm run dev` is all you need locally, with no separate backend.
function localApi() {
  return {
    name: 'local-api',
    configureServer(server) { mount(server, () => server.ssrLoadModule('/lib/api.js')); },
    configurePreviewServer(server) { mount(server, () => import('./lib/api.js')); },
  };
}

function mount(server, load) {
      server.middlewares.use('/api', async (req, res) => {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body = {};
        try { body = raw ? JSON.parse(raw) : {}; } catch {}
        const { route } = await load();
        const { status, body: out } = await route(req.method, req.url.split('?')[0], body, req.headers);
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(out));
      });
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  return { plugins: [react(), localApi()] };
});
