# How to Set Up the Database

The Pulse API (`apps/api`) currently uses **in-memory** storage (users and body logs are lost on restart). To persist data, add a **database** and set **`DATABASE_URL`** in your deployment.

---

## 1. Choose a database

**Postgres** is recommended (same on Railway, Render, Vercel + external DB, or standalone).

| Option | Best for | Free tier | Notes |
|--------|----------|-----------|--------|
| **Neon** | Serverless Postgres | Yes | [neon.tech](https://neon.tech) — get `DATABASE_URL` in the dashboard. Works well with Vercel. |
| **Supabase** | Postgres + Auth/API | Yes | [supabase.com](https://supabase.com) — Project Settings → Database → Connection string (URI). |
| **Railway** | Same place as API | Yes (usage-based) | Add **Postgres** add-on to your project; Railway sets `DATABASE_URL`. |
| **Render** | Same place as API | Yes | Add **Postgres** from dashboard; Render sets `DATABASE_URL`. |
| **Vercel Postgres** | Vercel-native | Yes (limit) | [Vercel Storage](https://vercel.com/docs/storage/vercel-postgres) — connects to Vercel project. |

**Simple path:** Use **Neon** or **Supabase** if your API is on Vercel; use **Railway Postgres** or **Render Postgres** if you deploy the API there.

---

## 2. Get a connection string

You need a **Postgres connection string** (URL). Format:

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

- **Neon:** Sign up → Create project → Dashboard shows **Connection string**. Copy the **URI** (e.g. `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`).
- **Supabase:** In the project dashboard, click the **Connect** button (top of the page). Choose **Direct connection** or **Transaction** (pooler, port 6543 – better for serverless). Copy the URI and replace `[YOUR-PASSWORD]` with your database password (URL-encode `@`, `%`, `#` if needed). Alternative path: **Project Settings** (gear) → **Database** → scroll to **Connection string**.
- **Railway / Render:** After adding Postgres, the platform adds **`DATABASE_URL`** to your app’s environment; no manual copy needed if you deploy the API on the same project.

---

## 3. Set DATABASE_URL where the API runs

- **Vercel:** Project → **Settings** → **Environment Variables** → Add **`DATABASE_URL`** → paste the connection string → Save. Redeploy.
- **Railway / Render:** Same: **Variables** (or **Environment**) → Add **`DATABASE_URL`** (or use the one auto-added when you attach Postgres).

Do **not** commit the URL to Git. Keep it only in the deployment environment.

---

## 4. Create tables (one-time)

Your Postgres database needs **tables** for users and body logs. Run this SQL once (e.g. in Neon/Supabase SQL editor, or via a migration script):

```sql
-- Users (email sign-in)
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ
);

-- Body logs (per user, per day)
CREATE TABLE IF NOT EXISTS body_logs (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  date       DATE NOT NULL,
  payload    JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_body_logs_user_date ON body_logs(user_id, date);
```

**Referrals and wallet (for Lab referral flow):** Run this extra SQL if you use referrals:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet TEXT;

CREATE TABLE IF NOT EXISTS referrals (
  id                TEXT PRIMARY KEY,
  referrer_user_id  TEXT NOT NULL,
  referred_email    TEXT NOT NULL,
  referred_wallet   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
```

**Last seen (for “who comes every day”):** If your `users` table was created before this column existed, add it with:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
```

**Points and login count:** Add columns for referral points, admin bonus points, and login count:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0;
```

The API updates `last_seen_at` and increments `login_count` on every `/auth/sync`. Referral completion credits `referral_points` to the referrer; admins grant `bonus_points` via `POST /admin/points`.

The API updates `last_seen_at` on every `/auth/sync` so you can query active users (e.g. in Supabase: “users active in last 24h” or in the Admin cabinet).

Adjust names or columns if your API expects different fields (e.g. `userId` vs `id`); the API code that reads/writes the DB must match this schema (or you change the schema to match the API).

---

## 4b. Enable Row Level Security (RLS) on Supabase

Supabase warns when tables in `public` are exposed to **PostgREST** but RLS is not enabled. Enabling RLS restricts access via the Supabase REST API (anon/authenticated keys). Your **Pulse API** uses a **direct Postgres connection** (DATABASE_URL with the database user). In Supabase, that connection uses a role that **bypasses RLS**, so the API keeps full access. Enabling RLS only locks down **PostgREST** (browser/client) access.

**Pulse architecture:** Auth is **Firebase** (Google sign-in), not Supabase Auth. The `users` table stores your own `id` (text) and is only accessed by the API over the direct connection. So you do **not** need policies that use `auth.uid()` or Supabase JWT for these tables.

### Recommended: enable RLS, no policies

Run this in **Supabase → SQL Editor** (after the tables exist):

```sql
-- Enable RLS so the "RLS Disabled in Public" advisory is resolved
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_logs ENABLE ROW LEVEL SECURITY;

-- If you created referrals:
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- No policies: anon and authenticated get no rows via PostgREST.
-- Your API (direct Postgres connection) bypasses RLS and continues to work.
```

**Result:** PostgREST (anon/authenticated) cannot read or write these tables. Only your API (direct connection) can. The advisory is cleared and sensitive data is not exposed via the Supabase API.

### If you later use Supabase Auth + PostgREST

If you ever expose these tables to the Supabase REST API and use **Supabase Auth** (e.g. `auth.uid()`), you would add RLS policies (e.g. “users can only read their own row”) and ensure the table’s primary key or auth column matches what `auth.uid()` returns. For the current setup (Firebase auth + API-only access), the “enable RLS, no policies” approach above is correct.

---

## 5. Wire the API to the database

**`apps/api`** is already wired to Postgres when **`DATABASE_URL`** is set: **`src/db.js`** creates a `pg` Pool and **`src/index.js`** uses it for auth (bcrypt) and body logs; otherwise it falls back to in-memory storage. You only need to run the table SQL (section 4) and set **`DATABASE_URL`**. Dependencies: `pg`, `bcrypt` (in `apps/api/package.json`).

(Code is already in place.)
---

## 6. Checklist

- [ ] Create a Postgres database (Neon, Supabase, Railway, or Render).
- [ ] Copy the **connection string** (URI).
- [ ] Set **`DATABASE_URL`** in your API’s environment (Vercel/Railway/Render).
- [ ] Run the **table-creation SQL** once in that database.
- [ ] Redeploy the API and test sign-up, sign-in, and body-logs.

---

## 7. Troubleshooting: "Database unreachable"

If the API returns **500** and the message says *"Database unreachable. Check DATABASE_URL and network"* (or *"Failed to list users"*), the DB connection is failing. Common causes:

### A. Wrong or outdated connection string

- **Supabase:** In the dashboard go to **Project Settings → Database**. Under **Connection string**, copy the **URI** again (Session mode = port **5432**, or use **Transaction** mode = port **6543** with the pooler host). Replace `DATABASE_URL` in `apps/api/.env` with that exact value and restart the API.
- **Neon / others:** Re-copy the connection string from the provider dashboard and update `DATABASE_URL`.

### B. Special characters in the password

If your DB password contains **`@`**, **`#`**, **`%`**, **`/`**, or other special characters, they **must be URL-encoded** inside `DATABASE_URL`:

| Character | Use in URL |
|-----------|------------|
| `@`       | `%40`      |
| `#`       | `%23`      |
| `%`       | `%25`      |
| `/`       | `%2F`      |

Example: password `wrU2@%z` → in the URL use `wrU2%40%25z` (so the full URI is still `postgresql://USER:wrU2%40%25z@HOST:PORT/DB`).

### C. Network / DNS (ENOTFOUND)

- Ensure the machine running the API has **internet** and can resolve the DB host (e.g. try pinging the host or opening the Supabase dashboard in a browser).
- If you're on a restricted network (e.g. corporate), outbound access to the DB host may be blocked; try another network or VPN.
- **Supabase:** If the project was paused, resume it in the dashboard; the hostname may not resolve when the project is paused.

### D. SELF_SIGNED_CERT_IN_CHAIN (e.g. on Vercel)

If `/health/db` returns `{ "ok": false, "error": "SELF_SIGNED_CERT_IN_CHAIN" }`, the API cannot verify the DB server’s SSL certificate. The API **defaults to accepting** the connection (so this usually resolves after a deploy). If you still see it, ensure you’ve deployed the latest API code. To enforce strict certificate verification, set **DATABASE_SSL_REJECT_UNAUTHORIZED=true** in the API project.

---

### E. Test the connection locally

From `apps/api` (with `DATABASE_URL` in `.env`):

Uses the same SSL behavior as the API: for Supabase/pooler, cert verification is relaxed by default (avoids `SELF_SIGNED_CERT_IN_CHAIN`). Set `DATABASE_SSL_REJECT_UNAUTHORIZED=true` to use strict verification.

```bash
cd apps/api && node -e "
require('dotenv').config();
const { Pool } = require('pg');
const cs = process.env.DATABASE_URL;
const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true' || process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === '1';
const pool = new Pool({
  connectionString: cs,
  ssl: cs && !cs.includes('localhost') ? { rejectUnauthorized } : false
});
pool.query('SELECT 1')
  .then(() => { console.log('DB connection OK'); process.exit(0); })
  .catch((e) => { console.error('DB connection failed:', e.message); process.exit(1); });
"
```

If this prints **"DB connection failed: getaddrinfo ENOTFOUND ..."**, fix the host or network. If it prints **"DB connection OK"**, the API should be able to reach the DB when you restart it.

---

📖 See also: [Deploy](./deploy.md) | [User Data Storage](./user-data-storage.md)
