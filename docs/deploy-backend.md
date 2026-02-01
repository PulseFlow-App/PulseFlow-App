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

## 3. Deploy steps (generic)

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

## 4. Env vars on the backend (summary)

| Variable | Required | Description |
|----------|----------|-------------|
| **JWT_SECRET** | Yes (for auth) | Secret used to sign JWTs (e.g. `openssl rand -hex 32`). |
| **DATABASE_URL** | If using DB | Postgres connection string (Railway/Render provide it). |
| **GOOGLE_AI_API_KEY** or **OPENAI_API_KEY** | Optional | Only if backend calls AI for `/insights/body-signals`. |

---

## 5. After deploy

- **Auth:** Mobile app will call `POST /auth/sign-in` and `POST /auth/sign-up`; users get a JWT and can use the app with data stored per user.
- **CORS:** If the app is web or you use a browser, allow your app origin in CORS. For React Native / Expo, same-origin isn’t an issue for native HTTP.
- **HTTPS:** All these platforms give you HTTPS by default.

---

## 6. Minimal API in this repo

There is a minimal API in `apps/api` (Node + Express) you can deploy as-is:

- **Run locally:** `cd apps/api && npm install && npm start` (see `apps/api/README.md`).
- **Deploy:** Set root to `apps/api` on Railway/Render, start command `npm start`, set `JWT_SECRET` (and optionally `DATABASE_URL`). Then set `EXPO_PUBLIC_API_URL` in the mobile app to the deployed URL.

You can replace stub routes with real DB and logic when ready.

---

📖 See also: [User Data Storage](./user-data-storage.md) | [Frontend & Testing](./frontend-and-testing.md)
