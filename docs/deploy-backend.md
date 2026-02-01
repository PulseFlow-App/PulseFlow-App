# How to Deploy the Pulse Backend

Your mobile app can work without a backend (local + Google AI). When you want **auth**, **user data**, and **AI via your server**, you deploy an API and set `EXPO_PUBLIC_API_URL` in the app.

---

## 1. What the backend must do

| Endpoint | Purpose |
|----------|--------|
| **POST /auth/sign-in** | `{ email, password }` → `{ user: { userId, email }, accessToken }` |
| **POST /auth/sign-up** | `{ email, password }` → `{ user, accessToken }` |
| **POST /insights/body-signals** | Body signals + score/trend → `{ insight, explanation, improvements }` (optional; app can use Google AI instead) |
| **GET /users/me/body-logs** | List body logs (auth required) |
| **POST /users/me/body-logs** | Create body log (auth required) |
| **GET /premium/status** | `?wallet=...` → `{ isPremium }` (read-only $PULSE staking check) |

See [User Data Storage](./user-data-storage.md) for the full contract.

---

## 2. Where to deploy

| Platform | Best for | Free tier | Notes |
|----------|----------|-----------|--------|
| **Vercel** | Serverless (Node/Express) | Yes | Add `api/` folder, deploy with `vercel`. Needs serverless route handlers. |
| **Railway** | Node/Express, DB | Yes (usage-based) | `railway up` or connect GitHub. Easy Postgres add-on. |
| **Render** | Node/Express | Yes (sleeps after idle) | Connect repo, set start command. Free Postgres. |
| **Fly.io** | Node/Express, global | Yes (small VMs) | `fly launch`, then `fly deploy`. |

**Simple path:** Use **Railway** or **Render** — connect your repo, set env vars, and they build + deploy. You get a URL like `https://your-app.up.railway.app` or `https://your-app.onrender.com`.

---

## 3. Deploy the API on Vercel (step-by-step)

The API in `apps/api` is an Express app. Vercel runs it as a single serverless function (zero config if the app is exported). Use a **separate Vercel project** for the API so you can give it its own URL (e.g. `https://api.pulseflow.site` or `pulse-api-xxx.vercel.app`).

### 3.1 Create the project and connect the repo

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import** your Git repository (e.g. **PulseFlow-App/PulseFlow-App**).
3. Before deploying, set the options below.

### 3.2 Project settings (API only)

| Setting | Value |
|--------|--------|
| **Root Directory** | `apps/api` — click **Edit**, set to `apps/api`, save. |
| **Framework Preset** | **Other** (or leave as detected; Vercel may detect Express). |
| **Build Command** | Leave empty (no build step). |
| **Output Directory** | Leave empty. |
| **Install Command** | `npm install` (default). |

Vercel will look for the app in `apps/api` and will use `src/index.js` (or `src/app.js` / `src/server.js`) as the Express entry. The repo’s `apps/api/src/index.js` exports the Express app when `VERCEL` is set, so it works as a single serverless function.

**If you see “No Output Directory named ‘public’ found”:** The API is not a static site; it doesn’t produce a `public` folder. The repo’s `apps/api/vercel.json` sets `buildCommand` to empty and `outputDirectory` to `.` so Vercel doesn’t expect one. Also in **Project Settings → Build & Development Settings**, set **Output Directory** to empty (clear the field) and **Build Command** to empty.

### 3.3 Environment variables

In the same project, open **Settings → Environment Variables** and add:

| Name | Value | Notes |
|------|--------|--------|
| `JWT_SECRET` | (random string, e.g. `openssl rand -hex 32`) | Required for auth. |
| `DATABASE_URL` | (optional) | Only if you add a DB later. |
| `GOOGLE_AI_API_KEY` or `OPENAI_API_KEY` | (optional) | Only if the API generates insights. |

Save. Redeploy so the new env vars are used.

### 3.4 Deploy

1. Click **Deploy** (or push to the connected branch; Vercel will deploy automatically).
2. When the deploy finishes, open the **project URL** (e.g. `https://pulse-api-xxx.vercel.app`). You should see a 404 or your root route; test an endpoint, e.g. `GET /health` → `{ "ok": true }`.

### 3.5 Custom domain (optional)

To use **api.pulseflow.site**:

1. In the project: **Settings → Domains → Add** → `api.pulseflow.site`.
2. In your DNS (where **pulseflow.site** is managed): add a **CNAME** record: **Name** `api`, **Target** the value Vercel shows (e.g. `cname.vercel-dns.com`).
3. Wait for Vercel to verify; HTTPS will be issued automatically.

See [Custom domains](custom-domains.md) for more detail.

### 3.6 Point the mobile app at the API

In `apps/mobile/.env` set:

```bash
EXPO_PUBLIC_API_URL=https://pulse-api-xxx.vercel.app
```

or, if you added the custom domain:

```bash
EXPO_PUBLIC_API_URL=https://api.pulseflow.site
```

No trailing slash. Restart the app (`npx expo start`).

---

## 4. Deploy steps (generic, other platforms)

1. **Build a small API** (e.g. in `apps/api`)  
   - Express or Fastify with routes for auth, body-logs, insights (optional), premium/status.  
   - Use a real DB (e.g. Postgres) for users and body logs, or start with SQLite/file for MVP.

2. **Create a project on your chosen platform**  
   - Railway: [railway.app](https://railway.app) → New Project → Deploy from GitHub (or CLI).  
   - Render: [render.com](https://render.com) → New → Web Service → Connect repo, set root to `apps/api`, start command e.g. `npm start`.

3. **Set environment variables** on the platform (not in code):  
   - `JWT_SECRET` — random string for signing JWTs.  
   - `DATABASE_URL` — if you use Postgres (Railway/Render give you one).  
   - `OPENAI_API_KEY` or `GOOGLE_AI_API_KEY` — if the backend generates insights (optional; app can use Google AI directly).

4. **Deploy**  
   - Push to GitHub (if connected) or use CLI (`railway up`, `render deploy`, etc.).  
   - Note the **public URL** (e.g. `https://pulse-api.up.railway.app`).

5. **Point the app at it**  
   - In `apps/mobile/.env` set:  
     `EXPO_PUBLIC_API_URL=https://your-api-url.com`  
   - No trailing slash. Restart the app (`npx expo start`).

---

## 5. Env vars on the backend (summary)

| Variable | Required | Description |
|----------|----------|-------------|
| **JWT_SECRET** | Yes (for auth) | Secret used to sign JWTs (e.g. `openssl rand -hex 32`). |
| **DATABASE_URL** | If using DB | Postgres connection string (Railway/Render provide it). |
| **GOOGLE_AI_API_KEY** or **OPENAI_API_KEY** | Optional | Only if backend calls AI for `/insights/body-signals`. |

---

## 6. After deploy

- **Auth:** Mobile app will call `POST /auth/sign-in` and `POST /auth/sign-up`; users get a JWT and can use the app with data stored per user.
- **CORS:** If the app is web or you use a browser, allow your app origin in CORS. For React Native / Expo, same-origin isn’t an issue for native HTTP.
- **HTTPS:** All these platforms give you HTTPS by default.

---

## 7. Minimal API in this repo

There is a minimal API in `apps/api` (Node + Express) you can deploy as-is:

- **Run locally:** `cd apps/api && npm install && npm start` (see `apps/api/README.md`).
- **Deploy:** Set root to `apps/api` on Railway/Render, start command `npm start`, set `JWT_SECRET` (and optionally `DATABASE_URL`). Then set `EXPO_PUBLIC_API_URL` in the mobile app to the deployed URL.

You can replace stub routes with real DB and logic when ready.

---

📖 See also: [User Data Storage](./user-data-storage.md) | [Setup Database](./setup-database.md) | [Frontend & Testing](./frontend-and-testing.md)
