# Full list of environment variables on Vercel

Use this as a checklist in **Vercel → Your project → Settings → Environment Variables**. You have **two** Vercel projects (PWA and API); set variables per project.

---

## 1. PWA project (apps/web)

**Vercel:** Root Directory = **`apps/web`**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| **VITE_API_URL** | No | Backend API base URL. When set, the PWA uses it for auth and for Body Signals AI (`POST /insights/body-signals`). No trailing slash. | `https://api.pulseflow.site` |
| **VITE_LOCKING_URL** | No | Locking page URL shown on the Pulse Lab page (`/lab`). If unset, the Lab shows “Locking URL will be available soon.” | `https://lock.pulseflow.site` |

**Notes:**

- All `VITE_*` variables are **baked in at build time**. Change them in Vercel → redeploy for the new values to appear in the app.
- No other env vars are read by the web app (Vite only exposes `import.meta.env.VITE_*`).

---

## 2. API project (apps/api)

**Vercel:** Root Directory = **`apps/api`**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| **DATABASE_URL** | Yes (for production) | Postgres connection string. If unset, the API uses in-memory storage (no persistent users or body logs). | `postgresql://user:pass@host:5432/db?sslmode=require` |
| **JWT_SECRET** | Yes (for production) | Secret used to sign and verify auth tokens. Use a long random string (e.g. `openssl rand -hex 32`). | (long random string) |
| **ADMIN_API_KEY** | No | Secret for `GET /admin/users` (list users). If set, call with `Authorization: Bearer <ADMIN_API_KEY>`. If unset, the endpoint returns 503. | (long random string) |

**How to get ADMIN_API_KEY:** You don’t “get” it from a service — you **generate** it yourself and set it only in your **API** project (never in the PWA or frontend). Generate a long random string, e.g. run in a terminal: `openssl rand -hex 32`. Copy the output and add it as `ADMIN_API_KEY` in Vercel → your **API** project → Settings → Environment Variables. Use that same value when opening the **Admin cabinet** in the web app (see below) or when calling the API with `curl`.
| **PORT** | No | Server port (Vercel usually ignores this; serverless uses the runtime default). | `3000` |

**Auto-set by Vercel (do not add yourself):**

- **VERCEL** – Set automatically; the API uses it to export the app for serverless.

---

## Checklist (copy and use)

### PWA (apps/web)

- [ ] `VITE_API_URL` – API base URL (optional)
- [ ] `VITE_LOCKING_URL` – Locking link for /lab (optional)

### API (apps/api)

- [ ] `DATABASE_URL` – Postgres connection string (required for persistent data)
- [ ] `JWT_SECRET` – Auth token secret (required for production)
- [ ] `ADMIN_API_KEY` – For /admin/users (optional)
- [ ] `PORT` – Optional (default 3000)

---

## Where to set them

1. **Vercel Dashboard** → Your **PWA** project → **Settings** → **Environment Variables** → add the PWA variables above.
2. **Vercel Dashboard** → Your **API** project → **Settings** → **Environment Variables** → add the API variables above.
3. Apply to **Production** (and optionally Preview) as needed.
4. **Redeploy** after adding or changing variables so the new build picks them up.
