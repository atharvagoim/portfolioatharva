# Atharva — Portfolio + Admin (single Vercel project)

One Vite + React app. The API lives in `/api` as a Vercel serverless function, so there's **no separate server**.

```
api/index.js      Vercel function (all /api/* routes)
lib/api.js        route logic + PIN auth
lib/store.js      MongoDB storage (local JSON file fallback for dev)
lib/seed.js       first-run content
src/site/*        portfolio sections
src/admin/*       admin panel (/admin)
public/assets     your images
```

## Run locally

```bash
npm install
cp .env.example .env     # set ADMIN_PIN (MONGODB_URI optional locally)
npm run dev
```

Open http://localhost:5173, and the admin at http://localhost:5173/admin.
Without `MONGODB_URI`, local edits are saved to `.data/db.json`.

## Deploy to Vercel

### 1. Database (needed for the admin panel to save)
Create a free MongoDB Atlas cluster → **Connect → Drivers** → copy the connection string.
In Atlas **Network Access**, allow `0.0.0.0/0` (Vercel IPs change).

### 2a. Deploy from GitHub (auto-deploys on every push)
1. Push this folder to a GitHub repo.
2. On vercel.com → **Add New → Project**. If you see *"To link a GitHub repository, you need to install the GitHub integration first"*:
   open https://github.com/apps/vercel → **Install/Configure** → choose your account → give it access to this repo → Save. Then come back and refresh.
3. **Import** the repo (Vite is detected automatically, `vercel.json` handles the rest).

### 2b. Or deploy without GitHub (Vercel CLI)
```bash
npm i -g vercel
vercel          # first run links/creates the project
vercel --prod   # production deploy
```

### 3. Environment variables
In **Project → Settings → Environment Variables** add (see `.env.example`):
- `ADMIN_PIN`: your admin PIN (defaults to `admin123` if missing, so set it!)
- `AUTH_SECRET`: any long random string
- `MONGODB_URI`: the Atlas connection string

Redeploy after adding them. On first load the database seeds itself with your content.
Check `https://<your-site>/api/health` and it should say `"storage":"mongodb"`.

If `MONGODB_URI` is missing, the live site still shows the default content but saving in the admin panel returns a "No database configured" message.

## Admin panel

- **Projects:** add/edit/delete/hide, upload **icon** (carousel), **logo**, **cover**, links and tags; drag ⋮⋮ or use ↑↓ to set the carousel order.
- **Site content:** About text + button link, Experience entries, contact links (GitHub, LinkedIn, Instagram, WhatsApp, Email, Phone), icon next to CONTACT.

Images are resized in the browser and stored in MongoDB. Vercel limits a single request to about 4.5 MB, which is plenty for icons and a screenshot per project.
