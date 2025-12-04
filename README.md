# ProfitCruiser - Premium Roblox Scripts

A modern, static website showcasing premium Roblox scripts with a beautiful dark gaming aesthetic.

**URL**: https://profitcruiser.com

## 🚀 Quick Start

```sh
npm install
npm run dev
```

### Start the API server (views, orders, admin dashboard)

The frontend now talks to a lightweight Node server that tracks script views, handles Robux orders, opens support chats and feeds the admin dashboard analytics.

```sh
npm run server
```

This exposes the API at `http://localhost:5174`. If you have already built the frontend (`npm run build`), the same command will also serve the static files from `dist/` so browsing to `http://localhost:5174` loads the full site. During development you can keep `npm run dev` and `npm run server` running side by side (or point the frontend to a remote API with `VITE_API_BASE_URL`).

Create a `.env` file (optional) to point the frontend at a remote API instance:

```env
VITE_API_BASE_URL=http://localhost:5174
```

### NOWPayments configuration

For production you must expose the NOWPayments credentials and domain details to the API server. Add them to your environment
variables (e.g. `.env.production`) before running `npm run server` or deploying the Worker:

```env
NP_API_KEY=9FVRGXK-JRNMPE8-HR9CZAZ-Y0C9S58
NP_IPN_SECRET=JpXlXcZiz3gA0Lje+EK05PPOeoz3q3C
PAY_CURRENCY=btc
PUBLIC_DOMAIN=https://profitcruiser.com
NP_WEBHOOK_URL=https://profitcruiser.com/api/nowpayments/webhook
```

> `PUBLIC_DOMAIN` is used to build the NOWPayments success/cancel URLs and webhook callback.

> The server stores its state in `server/data/state.json`. You can delete that file to reset demo orders/chats.

### Default accounts

- **Admin**: `admin@profitcruiser.gg` with password `ChangeMe123!`
- New customers can self-register from the **Logg inn / Opprett bruker** pages.

Update the admin password and guard `/admin` behind Cloudflare Zero Trust as described inside the dashboard for production.

## 📝 How to Add New Scripts (Super Easy!)

Adding new scripts is super easy! Just follow these 3 steps:

### 1. Add Thumbnail Image
Upload your script thumbnail to `/public/images/scripts/`
- **Filename**: `your-script-slug.webp` (use the same slug as in step 2)
- **Size**: 1280×720 or 1920×1080
- **Format**: WebP (preferred) or JPG/PNG
- **File Size**: Keep under 512 KB

### 2. Edit Scripts Data
Open `src/data/scripts.ts` and copy the template at the top of the file.

Fill in all the fields:
```typescript
{
  slug: 'your-script-slug',              // Used in URL (no spaces, lowercase)
  title: 'Your Script Title',            // Display name
  short: 'One-line description.',        // Short description
  category: 'shooter',                   // shooter | rpg | simulator | tycoon | fighting | adventure | misc
  tags: ['no-key', 'mobile'],            // Tags for filtering
  features: ['ESP', 'Aimbot'],           // Main features
  thumbnail: '/images/scripts/your-slug.webp',
  workink_url: 'https://work.ink/pc/your-link',
  status: 'active',                      // active | patched | private | archived
  compatibility: {
    pc: true,
    mobile: false,
    executor_required: true,
  },
  version: '1.0.0',
  release_date: '2025-10-01',            // YYYY-MM-DD
  updated_at: '2025-10-01',              // YYYY-MM-DD
  seo: {
    title: 'SEO Title (60 chars max)',
    description: 'SEO description (160 chars max)',
    keywords: ['keyword1', 'keyword2'],
  },
  description: `# Overview
Your detailed description with markdown formatting...

## Features
- Feature 1
- Feature 2

## How to use
1. Step 1
2. Step 2`,
  views: 1000,                           // Optional: for popularity sorting
  featured: true,                        // Optional: show in featured section (only 3 show)
}
```

### 3. Save and Done!
The script will automatically appear on the site with its own detail page at `/scripts/your-script-slug`

## 🎨 Features

- 🔍 **Search & Filter**: Real-time search with category and status filters
- 📊 **Sorting**: Sort by newest, recently updated, or popular
- ⭐ **Featured Section**: Highlight your top 3 scripts
- 📱 **Responsive Design**: Works perfectly on mobile and desktop
- 🎮 **Dark Theme**: Beautiful gaming aesthetic with purple accents
- 🔗 **Social Integration**: Discord and YouTube buttons in header and footer
- 🚀 **SEO Optimized**: Meta tags and OpenGraph for sharing
- ⚡ **Fast Loading**: Optimized images and lazy loading

## 🌐 Social Links

Update your social links in `src/pages/Index.tsx`:
- **YouTube**: Line ~72 (currently: https://www.youtube.com/@ProftCruiser/videos)
- **Discord**: Line ~60 (currently: https://discord.gg/M8RUGdQcng)

## 📦 Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory, ready to deploy to Cloudflare Pages or any static host.

## ☁️ Full Cloudflare Deployment Guide (Frontend + API)

The project is designed to run entirely on Cloudflare: the static Vite build lives on **Cloudflare Pages**, while the API/admin backend runs on a **Cloudflare Worker** with **D1** for persistence. Follow the checklist below to wire everything together from scratch.

### 1. Prerequisites

- Cloudflare account with an active zone (custom domain) and the ability to create Pages & Workers.
- Node.js 18+ and npm installed locally.
- `wrangler` CLI (`npm i -g wrangler`).
- GitHub (or GitLab/Bitbucket) repo containing this codebase.
- Optional but recommended: Cloudflare Zero Trust account (free tier) for locking down `/admin`.

### 2. Fork & Configure Repository

1. Push this project to your own Git repository (or fork from GitHub if already hosted).
2. Ensure the repository has the latest `dist/` build ignored (the Pages build step will generate it automatically).
3. Create the Cloudflare environment variables you plan to use:
   - `VITE_API_BASE_URL` (Pages → Settings → Environment variables → Production + Preview). This will point to your Worker URL once the API is deployed.
   - Optional secrets for API integrations (Stripe, Revolut IBAN, Discord webhooks). Add them later after the Worker is provisioned.

### 3. Provision the D1 Database

The local Node server stores analytics in `server/data/state.json`. In production we swap that for a D1 database.

```bash
wrangler login
wrangler d1 create profitcruiser
```

The command outputs a database ID—save it. Seed D1 with the defaults shipped in `server/defaults.js`:

```bash
wrangler d1 execute profitcruiser --file=server/schema.sql
wrangler d1 execute profitcruiser --file=server/seed.sql
```

> If `schema.sql` / `seed.sql` don’t exist yet, export the tables you need from `server/defaults.js` into SQL files (tables: `users`, `sessions`, `scripts`, `orders`, `chats`, `activities`, `viewTimeline`). Keeping schema files in Git makes deployments repeatable.

### 4. Deploy the API as a Worker

1. Create `wrangler.toml` in the project root if you haven’t already:

   ```toml
   name = "profitcruiser-api"
   main = "server/worker.ts"
   compatibility_date = "2024-05-01"
   compatibility_flags = ["nodejs_compat"]

   [[d1_databases]]
   binding = "DB"
   database_name = "profitcruiser"
   database_id = "<YOUR-D1-ID>"

   [vars]
   ADMIN_EMAIL = "admin@profitcruiser.gg"
   ```

2. Port `server/index.js` to `server/worker.ts` by wrapping the existing handlers in `export default { async fetch(request, env, ctx) { … } }` and replacing file-system reads with D1 queries via `env.DB`. The route structure and request bodies remain the same, so the React frontend keeps working.
3. Define Secrets (tokens, API keys) using Wrangler:

   ```bash
   wrangler secret put ADMIN_PASSWORD
   wrangler secret put STRIPE_SECRET_KEY
   wrangler secret put REVOLUT_IBAN
   ```

4. Deploy the Worker:

   ```bash
   npm run build     # optional – ensures TypeScript is clean before bundling
   wrangler deploy
   ```

5. Note the Worker URL (e.g., `https://profitcruiser-api.your-account.workers.dev`). Add it as `VITE_API_BASE_URL` in Cloudflare Pages.

6. (Optional) Attach a custom domain (Workers → Select Worker → Triggers → Add Custom Domain → `api.yourdomain.com`). Update DNS if prompted.

### 5. Deploy the Frontend on Cloudflare Pages

1. In Cloudflare Dashboard → Pages → **Create project**.
2. Connect to your Git repository.
3. Build settings:
   - **Framework preset**: `Vite` (or `None` with manual commands)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: `18.x`
4. Environment Variables (Production + Preview):
   - `VITE_API_BASE_URL=https://api.yourdomain.com` (or the workers.dev URL)
   - Any feature flags used by the app (`ENABLE_CHAT`, `RELEASE_CHANNEL`, etc.).
5. Start the deployment. Pages will run `npm install`, `npm run build`, and host the generated bundle.

Once the initial build completes you can map your apex/subdomain to Pages (Pages → Custom domains → Add → follow the DNS instructions).

### 6. Secure the Admin Dashboard

1. Cloudflare Zero Trust → Access → Applications → **Add an application** → **Self-hosted**.
2. Set the application domain to your admin route (e.g., `https://app.yourdomain.com/admin`).
3. Assign a policy that only allows your email(s) to authenticate via Google/Microsoft/GitHub.
4. Optionally enable device posture checks and mandatory MFA.
5. On the frontend, the `useAuth()` hook will still require valid API tokens, so the Worker remains the source of truth even if someone bypasses Access.

### 7. Automate Deployments (Optional but recommended)

- **Frontend**: Each push to `main` triggers a Pages build. Use branch deploys (`preview`) for staging.
- **Backend**: Add a GitHub Action that runs `wrangler deploy` on tag creation or merges to `main`. Store API keys in GitHub Secrets.
- **Database migrations**: Store SQL migration files under `server/migrations/` and run them via `wrangler d1 migrations apply` in CI before deploying the Worker.

### 8. Post-Deployment Checklist

- Update DNS records for `www`, `api`, and any marketing subdomains.
- Set up analytics: enable Cloudflare Web Analytics, connect Google Analytics if needed, and confirm D1 statistics appear in the admin dashboard charts.
- Test the Robux checkout flow (dummy Stripe/Revolut tokens) and verify that an admin chat auto-opens.
- Confirm view counters increment when visiting script detail pages.
- Verify Zero Trust prompts for login before `/admin` renders.
- Schedule regular D1 backups (`wrangler d1 backup create profitcruiser`).

With these steps your entire stack runs on Cloudflare’s edge network—fast static delivery via Pages and globally distributed API endpoints via Workers.

## 🎯 Project Structure

```
src/
├── components/
│   ├── ScriptCard.tsx       # Script preview card
│   └── ui/                  # Shadcn UI components
├── data/
│   └── scripts.ts           # 📝 EDIT THIS to add scripts
├── pages/
│   ├── Index.tsx            # Homepage with catalog
│   ├── ScriptDetail.tsx     # Individual script page
│   └── NotFound.tsx         # 404 page
├── types/
│   └── script.ts            # TypeScript types
└── index.css                # Global styles & theme

public/
└── images/
    └── scripts/             # 🖼️ ADD IMAGES HERE
```

You can edit this project locally or through any cloud IDE:

- **Local development** – Clone the repository, install dependencies with `npm install`, and run `npm run dev` for a hot-reloading preview.
- **GitHub Codespaces** – Launch a Codespace from the repository page to get an instant VS Code environment with Node.js pre-installed.
- **Browser editing** – Use GitHub's web editor for quick fixes by pressing `.` on the repository page.

Remember to keep Node.js (v18+) and npm up to date. We recommend using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) to manage versions.

## 🌈 Customization

### Colors & Theme
Edit `src/index.css` to customize the color palette:
- `--primary`: Main purple accent (line 20)
- `--background`: Dark background (line 11)
- `--card`: Card background (line 14)

## 🔧 Technologies

This project is built with:

- Vite
- TypeScript
- React 18
- React Router
- shadcn-ui components
- Tailwind CSS
- Lucide Icons
- React Markdown

## 🚀 Deployment

Deploy the static frontend with your preferred platform:
- **Cloudflare Pages** (recommended)
- Vercel
- Netlify
- Any static hosting service

## 💡 Tips

- Set `featured: true` on only your best 3 scripts to show in the featured section
- Add `views` numbers to enable popularity sorting
- Use descriptive SEO titles and descriptions for better search visibility
- Keep thumbnails under 512 KB for fast loading
- Use WebP format for images (smaller file size, better quality)

## 📄 License

All scripts are for educational purposes only.
© 2025 ProfitCruiser. All rights reserved.

---

## 🔗 Additional Resources

## 💡 Forslag til videre utvikling

Lyst til å gjøre siden enda mer nyttig? Her er noen idéer du kan vurdere:

- **Video- og GIF-forhåndsvisninger** – Vis hvordan scriptet fungerer i praksis direkte på produktsiden.
- **Brukeranmeldelser og rating** – La brukere gi tilbakemeldinger for å bygge tillit og vise hvilke scripts som er mest populære.
- **Kompatibilitetsfilter** – Legg til filtre for PC, mobil og ulike executors slik at brukerne raskt finner script som passer dem.
- **Automatisk statusvarsling** – Marker scripts som nylig er oppdatert eller som trenger vedlikehold, for eksempel via et lite badge-system.
- **Nyhetsseksjon eller changelog** – Del oppdateringer om nye scripts, patches og planlagte funksjoner for å holde communityet engasjert.
- **FAQ- og sikkerhetsguide** – Samle vanlige spørsmål, tips til trygg bruk og anbefalte executors på ett sted.
- **E-postvarsling eller RSS-feed** – Gi mulighet til å abonnere på nye scripts eller oppdateringer slik at brukerne alltid er oppdatert.

Disse forbedringene kan implementeres stegvis og hjelper både med engasjement og konvertering.

