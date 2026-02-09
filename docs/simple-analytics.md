# Simpler ways to track users (no admin password)

You don’t need the Admin cabinet or `ADMIN_API_KEY` for basic user analytics. Use one of these instead.

---

## Firebase vs Supabase in this project

| | **Firebase** | **Supabase** |
|---|--------------|--------------|
| **Used for** | **Sign-in (auth)** – “Sign in with Google”. | **Database (Postgres)** – users table, body logs, referrals. |
| **Where** | **Web app** (`apps/web`). | **API** (`apps/api`). |
| **Config** | `VITE_FIREBASE_*` in **web** `.env` (from Firebase Console → Project settings → Your apps). | **`DATABASE_URL`** in **API** `.env` – this is the **Supabase** connection string (Postgres URI from Supabase Dashboard → Settings → Database). |
| **No “database URL” for Firebase** | Firebase gives you apiKey, authDomain, projectId, etc. – not a single DATABASE_URL. | **DATABASE_URL = Supabase** (Postgres). |

So: **DATABASE_URL** is always **Supabase** (or any other Postgres). Firebase is only for login.

**Supabase → which env?**

From Supabase you only put **one** value in env:

| Env file | Variable | Where in Supabase |
|----------|----------|--------------------|
| **`apps/api/.env`** | **DATABASE_URL** | In the project dashboard, click **Connect** (top of page) → pick **Direct** or **Transaction** (pooler, port 6543 for serverless) → copy the URI → replace `[YOUR-PASSWORD]` with your DB password (URL-encode `@`, `%`, `#`). Not the “Project URL” – that’s the API URL; you need the **Postgres connection string** from Connect. |
| **`apps/web/.env`** | *(none)* | The web app does not use Supabase (it uses Firebase + your API). |

---

## 1. Supabase Dashboard (easiest – recommended)

Your users (and referrals) are stored in Postgres on Supabase. You can view and query them directly.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and open your project.
2. **Table Editor** → open the **`users`** table to see all rows (id, email, created_at).
3. **SQL Editor** → run queries, e.g.:
   - Total users: `SELECT count(*) FROM users;`
   - Signups per day: `SELECT date(created_at) AS day, count(*) FROM users GROUP BY 1 ORDER BY 1 DESC LIMIT 30;`
   - Recent signups: `SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 50;`

**No password in the app.** You use your Supabase login. No need to set `ADMIN_API_KEY` or open the Admin page unless you want the in-app user list.

---

## 2. Firebase Analytics (if you use Firebase Auth)

You already use Firebase for “Sign in with Google”. Adding Analytics gives you:

- Active users, retention, demographics (in Firebase Console).
- Custom events (e.g. “body_signal_logged”, “work_routine_checkin”) if you add a few `logEvent()` calls.

**Setup:** In [Firebase Console](https://console.firebase.google.com) → your project → **Analytics** → enable it. Your app may already include the Analytics SDK via Firebase; if not, add it and use the same config as Auth. View everything in **Analytics** in the Firebase Console – no admin page or API key.

---

## 3. Vercel Analytics (page views)

If the PWA is deployed on Vercel:

- **Vercel** → your **PWA** project → **Analytics** tab. Enable Vercel Analytics for simple page-view and traffic metrics.

No backend or password. Good for “how many visits” and top pages.

---

## When to keep the Admin page

Keep the in-app Admin cabinet only if you want to:

- See the user list **inside the app** (e.g. from a shared device without opening Supabase), or
- Build more in-app admin tools later.

Otherwise you can ignore it and use **Supabase** for user analytics and **Firebase / Vercel** for product analytics.
