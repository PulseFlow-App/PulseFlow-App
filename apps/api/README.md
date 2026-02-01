# Pulse API

Minimal backend for auth, body logs, insights, and premium status. The mobile app uses it when `EXPO_PUBLIC_API_URL` is set.

## Run locally

```bash
cd apps/api
npm install
npm start
```

Server runs at `http://localhost:3000`. For the app to use it from a device/simulator, either use your machine’s LAN IP (e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.x:3000`) or deploy (see below).

## Env vars

| Variable     | Required | Description |
|-------------|----------|-------------|
| `JWT_SECRET` | Yes (production) | Secret for signing JWTs. Generate with `openssl rand -hex 32`. |
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

3. **Point the app at it**
   - In `apps/mobile/.env` set:
     ```bash
     EXPO_PUBLIC_API_URL=https://your-deployed-url.com
     ```
   - No trailing slash. Restart the app (`npx expo start`).

## Endpoints

- `POST /auth/sign-up` — `{ email, password }` → `{ user, accessToken }`
- `POST /auth/sign-in` — `{ email, password }` → `{ user, accessToken }`
- `GET /users/me/body-logs` — list logs (Bearer token)
- `POST /users/me/body-logs` — create log (Bearer token)
- `POST /insights/body-signals` — stub; app can use Google AI instead
- `GET /premium/status?wallet=...` — stub; implement $PULSE staking check
- `GET /health` — health check

See [Deploy](../../docs/deploy.md) and [User Data Storage](../../docs/user-data-storage.md) for the full contract.
