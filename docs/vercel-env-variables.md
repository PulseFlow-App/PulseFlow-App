# Full list of environment variables on Vercel

Use this as a checklist in **Vercel → Your project → Settings → Environment Variables**. You have **two** Vercel projects (PWA and API); set variables per project.

---

## 1. PWA project (apps/web)

**Vercel:** Root Directory = **`apps/web`**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| **VITE_API_URL** | No | Backend API base URL. Required for **Body Signals AI recommendations** (insight, explanation, one thing to try). Also used for admin cabinet and referral completion. No trailing slash. If unset, you see rule-based suggestions and an error hint. | `https://pulseflow-app.vercel.app` |
| **VITE_FIREBASE_API_KEY** | No* | Firebase Web app config. From Firebase Console → Project settings → Your apps → Web app. Needed for “Sign in with Google”. | (from Firebase config) |
| **VITE_FIREBASE_AUTH_DOMAIN** | No* | Auth domain: use your **production app URL** so redirect lands on your app and `/_/firebase/init.json` is served. Must be in Firebase → Authorized domains. | `app.pulseflow.site` |
| **VITE_FIREBASE_PROJECT_ID** | No* | Firebase project ID. | `your-project-id` |
| **VITE_FIREBASE_STORAGE_BUCKET** | No* | Firebase storage bucket. | `your-project.appspot.com` |
| **VITE_FIREBASE_MESSAGING_SENDER_ID** | No* | Firebase messaging sender ID. | (numeric) |
| **VITE_FIREBASE_APP_ID** | No* | Firebase Web app ID. | `1:123:web:abc...` |
| **VITE_FIREBASE_MEASUREMENT_ID** | No | Firebase Analytics measurement ID. Optional; only needed if you enable Analytics. | `G-XXXXXXXXXX` |
| **VITE_LOCKING_URL** | No | Locking page URL for Lab (when you add the link back). | `https://lock.pulseflow.site` |
| **VITE_STAKING_URL** | No | Staking page URL (optional, for future use). | (URL) |

\* **Firebase:** If **all** of `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, and `VITE_FIREBASE_PROJECT_ID` are set, the login page shows **“Sign in with Google”**. If any are missing, login shows **“Continue with email”** (demo only). Copy the full Firebase config from Firebase Console → Project settings → Your apps → Web app. See [Firebase Google Auth](./firebase-google-auth.md).

**Notes:**

- All `VITE_*` variables are **baked in at build time**. Change them in Vercel → redeploy for the new values to appear in the app.
- Do **not** put Google OAuth Web client ID/secret here; those go only in Firebase Console (Authentication → Google).

---

## 2. API project (apps/api)

**Vercel:** Root Directory = **`apps/api`**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| **DATABASE_URL** | Yes (for production) | Postgres connection string. If unset, the API uses in-memory storage (no persistent users or body logs). | `postgresql://user:pass@host:5432/db?sslmode=require` |
| **JWT_SECRET** | Yes (for production) | Secret used to sign and verify auth tokens. Use a long random string (e.g. `openssl rand -hex 32`). | (long random string) |
| **ADMIN_API_KEY** | No | Password for Admin cabinet (`GET /admin/users`). Generate a secret; use the same value as the "password" in the web app Admin page. If unset, the endpoint returns 503. | (long random string) |
| **CORS_ORIGIN** | No | Single allowed origin for CORS (e.g. your PWA URL). If unset, all origins allowed. | `https://app.pulseflow.site` |
| **CORS_ORIGINS** | No | Comma-separated allowed origins (alternative to CORS_ORIGIN). | `https://app.pulseflow.site,https://www.pulseflow.site` |

**How to get ADMIN_API_KEY:** You don't "get" it from a service — you **generate** it yourself and set it only in your **API** project (never in the PWA or frontend). Generate a long random string, e.g. run in a terminal: `openssl rand -hex 32`. Copy the output and add it as `ADMIN_API_KEY` in Vercel → your **API** project → Settings → Environment Variables. Use that same value as the password in the Admin cabinet in the web app.
| **PORT** | No | Server port (Vercel usually ignores this; serverless uses the runtime default). | `3000` |

**Auto-set by Vercel (do not add yourself):**

- **VERCEL** – Set automatically; the API uses it to export the app for serverless.

**If Admin cabinet returns 500 when loading users:** The API is failing (often DB or env). In the **API** project on Vercel, set **DATABASE_URL** and **ADMIN_API_KEY**, then redeploy. If the DB is unreachable from Vercel (e.g. Supabase paused or wrong URL), you get 500; see [Setup database → Troubleshooting](./setup-database.md#7-troubleshooting-database-unreachable).

---

## Checklist (copy and use)

### PWA (apps/web)

- [ ] `VITE_API_URL` – API base URL (optional; for admin, referrals, body logs)
- [ ] `VITE_FIREBASE_API_KEY` – Firebase config (required for Google sign-in)
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` – Firebase config
- [ ] `VITE_FIREBASE_PROJECT_ID` – Firebase config
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` – Firebase config
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` – Firebase config
- [ ] `VITE_FIREBASE_APP_ID` – Firebase config
- [ ] `VITE_FIREBASE_MEASUREMENT_ID` – Optional (Analytics)
- [ ] `VITE_LOCKING_URL` – Optional (Lab locking link)
- [ ] `VITE_STAKING_URL` – Optional (future use)

### API (apps/api)

- [ ] `DATABASE_URL` – Postgres connection string (required for persistent data and referrals)
- [ ] `JWT_SECRET` – Auth token secret (required for production)
- [ ] `ADMIN_API_KEY` – Password for Admin cabinet / `GET /admin/users` (optional)
- [ ] `CORS_ORIGIN` or `CORS_ORIGINS` – Allowed origins (optional; recommended in production)
- [ ] `PORT` – Optional (default 3000)

---

## Where to set them

1. **Vercel Dashboard** → Your **PWA** project → **Settings** → **Environment Variables** → add the PWA variables above.
2. **Vercel Dashboard** → Your **API** project → **Settings** → **Environment Variables** → add the API variables above.
3. Apply to **Production** (and optionally Preview) as needed.
4. **Redeploy** after adding or changing variables so the new build picks them up.
