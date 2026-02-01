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
- **Supabase:** Project → **Settings** → **Database** → **Connection string** → **URI** (use the one with password filled in or copy from env).
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
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
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

Adjust names or columns if your API expects different fields (e.g. `userId` vs `id`); the API code that reads/writes the DB must match this schema (or you change the schema to match the API).

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

📖 See also: [Deploy](./deploy.md) | [User Data Storage](./user-data-storage.md)
