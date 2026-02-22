# Pulse API

Minimal backend for auth, body logs, insights, and premium status. The web PWA uses it when `VITE_API_URL` is set.

## Run locally

```bash
cd apps/api
npm install
npm start
```

Server runs at `http://localhost:3000`. Set `VITE_API_URL` in the web app (e.g. `http://localhost:3000` locally or your deployed API URL) so the PWA uses this API.

## Env vars

| Variable     | Required | Description |
|-------------|----------|-------------|
| `JWT_SECRET` | Yes (production) | Secret for signing JWTs. Generate with `openssl rand -hex 32`. |
| `DATABASE_URL` | No | Postgres connection string; if unset, in-memory storage. |
| `ADMIN_API_KEY` | No | Password for Admin cabinet (`GET /admin/users`, `POST /admin/points`). |
| `CORS_ORIGIN` | No | Single allowed origin for CORS (e.g. your PWA URL). If unset, all origins allowed. |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (alternative to CORS_ORIGIN). |
| `PORT`       | No | Port (default 3000). Set by Railway/Render. |

## Grant test points (by email)

**Option A – Direct DB (no API server needed)**  
With `DATABASE_URL` in `apps/api/.env` (or set in the shell):

- **From repo root:**  
  `node apps/api/scripts/grant-bonus-points.js lumina.envisions@gmail.com 100`
- **From `apps/api`:**  
  `node scripts/grant-bonus-points.js lumina.envisions@gmail.com 100`

**Option B – Via API (no direct DB needed)**  
If Option A fails with "Database login failed", use the API instead. In `apps/api/.env` set `ADMIN_API_KEY` (any secret string). Start the API in one terminal (`npm start`); the API will use `DATABASE_URL` from the same `.env`. In another terminal, from `apps/api`:

```bash
ADMIN_API_KEY=your-key npm run grant-points -- lumina.envisions@gmail.com 100
```

Or from repo root: `ADMIN_API_KEY=your-key node apps/api/scripts/grant-bonus-points.js lumina.envisions@gmail.com 100`

**Option C – curl**  
With the API running:

```bash
curl -X POST "$API_BASE/admin/points" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -d '{"email":"lumina.envisions@gmail.com","amount":100}'
```

The user must exist in `users` (signed in at least once).

- **ENOTFOUND:** Fix the host in `DATABASE_URL` or resume a paused Supabase project.
- **Database login failed (28P01):** Use **Option B** above (start API, then run the script with `ADMIN_API_KEY`) so the API does the DB connection; or fix the URI (Supabase: Transaction string, database password, URL-encode `@#%`). See [docs/setup-database.md](../docs/setup-database.md).

## Deploy

1. **Railway**
   - Go to [railway.app](https://railway.app), New Project → Deploy from GitHub.
   - Select this repo, set **Root Directory** to `apps/api`.
   - Set **Start Command** to `npm start` (or leave default).
   - Add variable `JWT_SECRET` (generate a random string).
   - Deploy; copy the public URL (e.g. `https://pulse-api.up.railway.app`).

2. **Render**
   - Go to [render.com](https://render.com), New → Web Service.
   - Connect repo, set **Root Directory** to `apps/api`.
   - Build: `npm install`, Start: `npm start`.
   - Add env var `JWT_SECRET`.
   - Deploy; copy the URL (e.g. `https://pulse-api.onrender.com`).

3. **Point the web app at it**
   - In the PWA project (Vercel/Netlify or `apps/web/.env`), set `VITE_API_URL=https://your-deployed-url.com` (no trailing slash). Redeploy the PWA if needed.

## Endpoints

- `POST /auth/sign-up`  - `{ email, password }` → `{ user, accessToken }`
- `POST /auth/sign-in`  - `{ email, password }` → `{ user, accessToken }`
- `GET /users/me/body-logs`  - list logs (Bearer token)
- `POST /users/me/body-logs`  - create log (Bearer token)
- `GET /users/me/check-ins`  - list work routine check-ins (Bearer token; optional `?from=&to=` YYYY-MM-DD)
- `POST /users/me/check-ins`  - create check-in (Bearer token)
- `POST /insights/body-signals`  - stub; app can use Google AI instead
- `GET /premium/status?wallet=...`  - stub; implement $PULSE locking check
- `GET /health`  - health check

See [Deploy](../../docs/deploy.md) and [User Data Storage](../../docs/user-data-storage.md) for the full contract.
