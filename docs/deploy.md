# How to Deploy Pulse

Deploy the **PWA** (`apps/web`) so it’s live over HTTPS. Then optionally point a domain and publish to Google Play via TWA. The API can be deployed from the same repo with Root Directory `apps/api` (see "API project failing on Vercel?" below).

---

## Deploy at https://app.pulseflow.site

End result: your PWA is served at **https://app.pulseflow.site**. Two parts: (1) deploy the app on a host, (2) point the domain at that host.

### 1. Deploy the PWA on a host (Vercel or Netlify)

- **Vercel:** Add a **new project** from your repo. Set **Root Directory** to **`apps/web`**. Deploy. You get a URL like `pulse-web-xxx.vercel.app`.
- **Netlify:** Add a **new site** from the same repo. **Base directory:** `apps/web`, **Build command:** `npm run build`, **Publish directory:** `dist`. Deploy. You get a URL like `xxx.netlify.app`.

(Details are in "Option A: Vercel" and "Option B: Netlify" below.)

### 2. Add the domain in the hosting dashboard

- **Vercel:** Open the **PWA project** (not the API) → **Settings** → **Domains** → **Add** → enter **`app.pulseflow.site`** → Save. Vercel will show the DNS record you need (see step 3).
- **Netlify:** Open the **site** → **Domain management** (or **Site configuration** → **Domains**) → **Add domain** / **Add custom domain** → enter **`app.pulseflow.site`** → Add. Netlify will show the DNS record you need.

### 3. Point the domain at the host (DNS at your registrar)

You need to add **one DNS record** where **pulseflow.site** is managed (e.g. Cloudflare, Namecheap, Google Domains, Vercel Domains, etc.). That place is your **DNS host** (often the same as where you bought the domain).

**What to add:**

| Type  | Name / Host | Value / Target / Points to |
|-------|-------------|----------------------------|
| **CNAME** | `app` | The value the host gives you (see below) |

- **Vercel:** In **Settings → Domains**, after adding `app.pulseflow.site`, Vercel shows something like **"Configure your DNS"** with a **CNAME** row. The **Value** is usually `cname.vercel-dns.com` or a project-specific target (e.g. `cname-xxx.vercel-dns.com`). In your DNS host, create:
  - **Name:** `app` (or `app.pulseflow.site` if the host requires the full name)
  - **Type:** CNAME
  - **Value:** paste exactly what Vercel shows
- **Netlify:** After adding the domain, Netlify shows a **CNAME** target (e.g. `xxx.netlify.app` or `apex-loadbalancer.netlify.com`). In your DNS host, create:
  - **Name:** `app`
  - **Type:** CNAME
  - **Value:** the target Netlify shows

**Where to add it (examples):**

- **Cloudflare:** **Websites** → **pulseflow.site** → **DNS** → **Records** → **Add record** → Type **CNAME**, Name **app**, Target = value from Vercel/Netlify → Save.
- **Namecheap:** **Domain List** → **Manage** next to pulseflow.site → **Advanced DNS** → **Add New Record** → Type **CNAME**, Host **app**, Value = target from Vercel/Netlify → Save.
- **Google Domains / Squarespace Domains:** DNS / Nameservers section → **Custom records** (or **Resource records**) → Add **CNAME** with name **app** and value = target from host.
- **Vercel Domains:** If pulseflow.site is on Vercel Domains, add the domain in the **same** Vercel project (Settings → Domains → Add `app.pulseflow.site`); Vercel may configure DNS for you, or show the CNAME to add elsewhere.

**After you save the CNAME:** Propagation can take a few minutes up to 48 hours (often under 10 minutes). The host will then verify the domain and turn on **HTTPS** automatically. When **Settings → Domains** (Vercel) or the domain list (Netlify) shows the domain as verified, **https://app.pulseflow.site** will serve your PWA.

**Troubleshooting:** If the domain stays "unverified" or doesn't load: double-check **Name** is `app` (no typo) and **Value** is exactly what the host shows (no extra spaces, no `https://`). If you use Cloudflare proxy (orange cloud), it's fine; both Vercel and Netlify work with it.

---

## API project failing on Vercel? (API project only)

**This section is only for the project that deploys the backend** (Root Directory `apps/api`). Your **web/PWA project** is separate and should keep Root Directory = **`apps/web`**; do not change the web project to `apps/api`.

If the **API** project (the one for the backend) fails (e.g. "cd apps/api: No such file or directory" or "Deployment failed with error"):

1. **Set Root Directory to `apps/api`**  
   In the project: **Settings** → **General** → **Root Directory** → set to **`apps/api`** (so Vercel uses `apps/api/vercel.json` and runs install/build from that folder). Do **not** use a custom build command like `cd apps/api && npm run build` when root is already `apps/api`.

2. **Use the repo's API config**  
   `apps/api/vercel.json` is set up to run the Express app as a **serverless function** (not a static site). Vercel will build `src/index.js` with `@vercel/node` and route all requests to it. Your API already exports the app when `process.env.VERCEL` is set.

3. **Redeploy**  
   Trigger a new deployment (e.g. push a commit or **Redeploy** in the Vercel dashboard). If the project had overrides (e.g. build command `cd apps/api && npm run build`), clear them so Vercel uses the defaults for the `apps/api` root.

4. **Env vars**  
   In **Settings** → **Environment Variables**, add `DATABASE_URL` and `JWT_SECRET` if you use Postgres and custom JWT.

5. **If you see "cd apps/api: No such file or directory"**  
   The project is still using an old Install command (`cd apps/api && npm install`). Override it explicitly so Vercel stops using the old value:
   - **Root Directory:** **Build and Deployment** → scroll to **Root Directory** → set to **`apps/api`** (Edit → `apps/api` → Save).
   - **Install Command:** Under **Framework Settings**, find **Install Command**. **Turn the Override toggle ON** and set the value to exactly **`npm install`** (no `cd`). Save.
   - **Build Command:** Turn **Build Command** Override **ON** and set to **`npm run build`**. Save.
   - **Redeploy:** Trigger a new deployment. The build will run from `apps/api` with `npm install` and `npm run build` only.

---

## Prerequisites (PWA)

1. **PWA icons** (recommended before deploy)  
   Add to `apps/web/public/icons/`:
   - `icon-192.png` (192×192)
   - `icon-512.png` (512×512)  
   Use the Pulse logo or any 192×192 and 512×512 PNG (e.g. `apps/web/public/icons/`). Without these, the browser uses a default icon.

2. **Build works locally**  
   From repo root:
   ```bash
   cd apps/web && npm install && npm run build
   ```
   You should get a `dist/` folder with no errors.

---

## Repo already imported as API?

You can have **multiple projects** from the same repo. Keep your existing API project as-is and add a **second project** for the PWA:

- **Vercel:** Dashboard → **Add New** → **Project** → select the **same** PulseFlowApp repo. Give it a different name (e.g. `pulse-web` or `pulse-pwa`). Set **Root Directory** to `apps/web` for this new project. Your API project stays unchanged.
- **Netlify:** **Add site** → **Import an existing project** → choose the same repo. This creates a second site; set base directory to `apps/web` and name it something like "Pulse Web".

Each project gets its own URL and domain settings. API stays on one URL, PWA on another (or you point your main domain at the PWA and keep the API on a subdomain like `api.pulseflow.site`).

---

## Web project: succeed and copy logs

**Goal:** Deploy the PWA (`apps/web`) and know what a successful build looks like (and where to copy logs from if it fails).

### 1. Create / configure the web project (Vercel)

- **New project:** **Add New** → **Project** → select **PulseFlow-App/PulseFlow-App** (same repo). Name it e.g. **pulse-web** (so it’s the PWA, not the API).
- **Root Directory:** **Build and Deployment** → **Root Directory** → **Edit** → set to **`apps/web`** → Save. Do **not** set `apps/api` here; the web project must use `apps/web`.
- **Framework / commands:** Leave **Framework Preset** as **Vite** (or Other). Leave **Build Command**, **Output Directory**, and **Install Command** as default (no override needed). Defaults are: Build `npm run build`, Output `dist`, Install `npm install`.
- **Deploy:** Click **Deploy** (or push to `main` if the project is already connected).

### 2. What a successful build looks like (logs you can copy)

In **Deployments** → click the deployment → **Building** / **Build Logs**. A **successful** web build typically shows something like:

```
Cloning github.com/PulseFlow-App/PulseFlow-App (Branch: main, Commit: ...)
Cloning completed: ...
Running "install" command: `npm install`...
... (npm output) ...
added XXX packages
Running "build" command: `npm run build`...
vite v6.x.x building for production...
... (Vite build output) ...
Build Completed in /vercel/output/static
```

Then the deployment moves to **Ready** and you get a URL (e.g. `pulse-web-xxx.vercel.app`). If you see **Build Completed** and **Ready**, the web project deployed successfully.

### 3. If the build fails: copy logs and what to check

- **Where to copy logs:** **Deployments** → click the **failed** deployment → open **Build Logs**. Scroll to the bottom; the error is usually in the last 20–30 lines. Copy that whole block (or from “Running …” to the end) when asking for help or debugging.
- **Web project must use Root `apps/web`.** If the logs show `cd apps/api` or “apps/api: No such file or directory”, you’re in the **API** project’s settings, or the project’s Root Directory is wrong. Open the **web** project (e.g. pulse-web) and set Root Directory to **`apps/web`** only.
- **Install/Build:** For the web project, Install should be `npm install` and Build `npm run build` with no `cd`. If you had overrides from another project, set **Override** to **ON** and set Install to `npm install`, Build to `npm run build`, and Root to `apps/web`.
- **Node / npm errors:** If the log shows a missing module or Node version error, it’s usually fixable in the repo (e.g. lockfile or engines). Copy the exact error line from the log.

### 4. Point domain (e.g. app.pulseflow.site)

After a successful deploy: **Settings** → **Domains** → **Add** → **`app.pulseflow.site`** → then add the **CNAME** at your DNS host (see “Deploy at https://app.pulseflow.site” above).

---

## Environment variables (Vercel)

Set these in each project: **Settings** → **Environment Variables**. Redeploy after adding or changing vars.

### API project (Root Directory `apps/api`)

| Variable        | Required | Description |
|-----------------|----------|-------------|
| `JWT_SECRET`    | **Yes** (production) | Secret used to sign/verify auth tokens. Use a long random string; without it the API falls back to a dev default (insecure). |
| `DATABASE_URL`  | No | Postgres connection string (e.g. from Neon, Supabase, Railway). If unset, the API uses in-memory storage (fine for trying it out; not persistent). |

Vercel sets `PORT` and `VERCEL` automatically; you don’t need to add them.

### PWA / web project (Root Directory `apps/web`)

| Variable        | Required | Description |
|-----------------|----------|-------------|
| `VITE_API_URL`  | No | Base URL of your deployed API (e.g. `https://pulse-api-xxx.vercel.app`). If set, the web app will call this API for login and data; if unset, it uses demo/local behavior. |

Vite only exposes variables that start with `VITE_` to the client; use that prefix for any other front-end config you add later.

---

## Option A: Vercel (recommended)

1. **Sign in** at [vercel.com](https://vercel.com) (GitHub/GitLab/Bitbucket).

2. **Add a new project** from your repo: **Add New** → **Project** → select PulseFlowApp (same repo as your API). Name it e.g. `pulse-web` so it’s clear it’s the PWA.

3. **Configure the project** (monorepo):
   - **Root Directory:** click **Edit**, set to `apps/web`.
   - **Framework Preset:** Vite (auto-detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `dist` (default).
   - **Install Command:** `npm install` (default).

4. **Environment variables** (optional):  
   If you use an API, add e.g. `VITE_API_URL` in **Settings → Environment Variables**.  
   Redeploy after adding env vars.

5. **Deploy**  
   Click **Deploy**. Vercel builds from the `apps/web` root and serves `dist/` over HTTPS.

6. **Domain**  
   You get a URL like `pulse-web-xxx.vercel.app`. In **Settings → Domains** you can add a custom domain (e.g. pulseflow.site) and follow the DNS instructions.

---

## Option B: Netlify

1. **Sign in** at [netlify.com](https://netlify.com) and connect your Git provider.

2. **Add site** → **Import an existing project** → choose your PulseFlowApp repo (same repo as your API; this creates a second site).

3. **Build settings** (monorepo):
   - **Base directory:** `apps/web`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist` (relative to base, so `apps/web/dist`)

4. **Deploy**  
   Click **Deploy site**. Netlify runs `npm install` and `npm run build` inside `apps/web` and publishes `dist/`.

5. **Domain**  
   You get a URL like `random-name-xxx.netlify.app`. In **Domain settings** add a custom domain and set the DNS records Netlify shows.

---

## After deploy

- **HTTPS** – Both Vercel and Netlify serve over HTTPS, which is required for the PWA (service worker, install prompt).
- **Test** – Open the live URL, try **Add to Home Screen** on iOS and Android.
- **Custom domain** – Point your domain (e.g. pulseflow.site) in the platform’s domain settings; update DNS at your registrar as instructed.
- **Google Play (optional)** – Once the PWA is live, use [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) or [PWABuilder](https://pwabuilder.com) to build a TWA and submit to Play. See [PWA and Google Play](./pwa-and-google-play.md).

---

## Quick reference

| Platform | Root        | Build command     | Publish dir |
|----------|-------------|-------------------|-------------|
| Vercel   | `apps/web`  | `npm run build`   | `dist`      |
| Netlify  | `apps/web`  | `npm run build`   | `dist`      |
