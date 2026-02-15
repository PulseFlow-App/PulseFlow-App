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

- `POST /auth/sign-up` — `{ email, password }` → `{ user, accessToken }`
- `POST /auth/sign-in` — `{ email, password }` → `{ user, accessToken }`
- `GET /users/me/body-logs` — list logs (Bearer token)
- `POST /users/me/body-logs` — create log (Bearer token)
- `GET /users/me/check-ins` — list work routine check-ins (Bearer token; optional `?from=&to=` YYYY-MM-DD)
- `POST /users/me/check-ins` — create check-in (Bearer token)
- `POST /insights/body-signals` — stub; app can use Google AI instead
- `GET /premium/status?wallet=...` — stub; implement $PULSE locking check
- `GET /health` — health check

See [Deploy](../../docs/deploy.md) and [User Data Storage](../../docs/user-data-storage.md) for the full contract.
