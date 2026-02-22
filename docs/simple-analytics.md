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

---

## Is Firebase counting users too? What is Supabase for? Can we drop it?

**Yes, Firebase counts users.** In [Firebase Console](https://console.firebase.google.com) → **Authentication** → **Users**, you see everyone who signed in with Google. So you have two places that can list “users”:

| Where | What it is |
|-------|------------|
| **Firebase Authentication** | Every Google (and email-link) sign-in. Use this for “how many people signed in” and basic identity. |
| **Supabase `public.users`** | Rows created by your API when someone logs in (`/auth/sync`) or completes a referral. Used for the in-app Admin list and referral logic. |

**What Supabase is used for here (all in Postgres):**

1. **`public.users`** – So the API (and Admin page) can list “app users” and link referrals. Populated by `/auth/sync` and `/referrals/complete`.
2. **`body_logs`** – Table exists in the API for Body Signals, but the **current web app does not send** body logs to the API; it keeps them in **localStorage** only. So Supabase body_logs are only used if you add sync or another client.
3. **`referrals`** – Referral tracking (who referred whom).

**Where your app’s data actually lives today:**

| Data | Stored in | Supabase? |
|------|-----------|-----------|
| **Auth users** | Firebase (Auth) + optional copy in `public.users` via `/auth/sync` | `public.users` only if sync runs |
| **Body Signals** (logs, pulse) | **localStorage** in the browser | No (API has a table but the PWA doesn’t sync to it) |
| **Work Routine** (check-ins, insights) | **localStorage** in the browser | No – no Work Routine table or API; it’s client-only |
| **Referrals** | API when user completes referral | Yes, `referrals` table |

So “body counts” and “work routine counts” in the app are **not** in Supabase right now; they’re only in the device’s localStorage. Only **users** (if sync is on) and **referrals** are in Supabase.

**Can we get rid of Supabase and use only Firebase?**

- **Firebase only for “user count”:** Yes. You can ignore Supabase for user counts and use **Firebase Console → Authentication → Users** as your only user list. You’d still need Supabase (or another DB) if you want to keep **body_logs** and **referrals** in a backend database.
- **Truly “only Firebase” (no Supabase at all):** Only if you move **body_logs** and **referrals** somewhere else, e.g. **Firestore** (Firebase). Then your API would use the Firebase Admin SDK and Firestore instead of Postgres. That’s a different design (different API and possibly client-side Firestore with security rules). So:
  - **Keep current setup:** Firebase = auth. Supabase = Postgres for users table, body_logs, referrals.
  - **Simplify “user list” only:** Use Firebase Console for user count; you can stop syncing to `public.users` and remove the Admin user list (you’d still need Supabase for body_logs and referrals unless you migrate those too).
  - **Drop Supabase entirely:** Use Firebase Auth + Firestore (or Realtime DB) for body_logs and referrals; remove Postgres and the current API’s DB layer. Bigger change.

**Short answer:** Firebase is already counting (and listing) your auth users. Supabase here is your **database** for app users (optional for “counting”), **body_logs**, and **referrals**. You can rely on Firebase for user counts and only use Supabase for logs and referrals; you can only get rid of Supabase completely by moving that data to Firebase (e.g. Firestore) and changing the API.

---

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
   - Recent signups: `SELECT id, email, created_at, last_seen_at FROM users ORDER BY created_at DESC LIMIT 50;`
   - **Who was active in the last 24h** (requires `last_seen_at` column): `SELECT id, email, last_seen_at FROM users WHERE last_seen_at > NOW() - INTERVAL '24 hours' ORDER BY last_seen_at DESC;`
   - **Who was active in the last 7 days:** `SELECT id, email, last_seen_at FROM users WHERE last_seen_at > NOW() - INTERVAL '7 days' ORDER BY last_seen_at DESC;`

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

np---

## Privacy, database, and “who comes every day”

### Do we need Body Signals and Work Routine in the database? Is it against the privacy policy?

**No, it’s not against the policy.** The [privacy policy](privacy-policy.md) says we collect “body signals, check-ins, and other data you enter” and use them “to provide insights and the Daily Pulse score.” It does **not** say “we only store on device.” So:

- **Storing in DB:** Allowed, as long as you stay transparent (e.g. “data may be stored on our servers to provide sync and insights”). You’d typically mention server storage in the policy if you add sync.
- **Keeping in localStorage only (current setup):** Also fine and more privacy-preserving. No change to the policy needed.

**Today:** Body Signals and Work Routine are **only in localStorage**. The API has a `body_logs` table but the PWA doesn’t write to it. So you can keep it local-only, or add sync later and update the policy if you want cross-device or server-side insights.

### Is localStorage enough to build their personality and profile?

- **On a single device:** Yes. The app can build personality and profile from localStorage (body signals, routine, check-ins) and show Daily Pulse and insights on that device.
- **Across devices or for your analytics:** No. localStorage is per-browser and not synced. To have one profile on phone + laptop, or to see “who uses the app every day” in the admin, you need either:
  - **Lightweight:** Only track “last seen” (and maybe login count) in the DB -no body/work data -so you can see who’s active daily; personality stays in localStorage, or
  - **Full sync:** Store body_logs (and optionally work routine) in the DB so profile and personality can be built server-side and shared across devices.

So: **localStorage is enough for personality/profile on one device.** For cross-device or “who comes every day” stats, you need at least last-seen (or an analytics product) in addition.

### Can we show Firebase users in the Admin panel?

**Yes.** Right now the Admin panel calls `GET /admin/users`, which reads **Supabase** `public.users` (filled when someone hits `/auth/sync`). To also (or instead) show **Firebase Authentication** users:

- **Option A – Use Firebase Console:** [Firebase Console](https://console.firebase.google.com) → **Authentication** → **Users**. No code changes; you see everyone who signed in with Google (or email link). No in-app Admin needed.
- **Option B – In-app Admin:** Add the **Firebase Admin SDK** to the API, then a new endpoint (e.g. `GET /admin/firebase-users`) that lists Firebase Auth users. The Admin page can then call that and show Firebase users (or merge with Supabase users). See [Viewing Firebase users in Admin](#viewing-firebase-users-in-admin) below for setup.

### Do I see their logins only once (when they first enter)?

**Yes, with the current setup.** A row in `public.users` is created **once** when they first hit `/auth/sync` (first login). There is no “login event” stored per visit -so you see “user exists” and “signed up at …”, but not “logged in today” or “last active”.

If you add **last seen** (see below), you’ll see **last time they opened the app** (or synced), which effectively shows “who came recently” and “who comes every day” when you query by `last_seen_at`.

### How can I see who comes every day and get stats?

1. **Add last-seen tracking (recommended for your stack):**  
   - Add a `last_seen_at` column to `users` and update it on every `/auth/sync` (or on a dedicated ping).  
   - Then in Supabase SQL or in the Admin API you can:
     - “Who was active in the last 24h”: `WHERE last_seen_at > NOW() - INTERVAL '24 hours'`
     - “Who comes every day”: count distinct users per day by `last_seen_at` (or add a small `activity` table if you want multiple events per day).
   - This does **not** require storing body signals or work routine in the DB.

2. **Use an analytics product:**  
   - **Firebase Analytics:** daily active users, retention, demographics. Enable in Firebase Console; add the SDK in the app if needed.  
   - **Vercel Analytics:** page views and traffic if the PWA is on Vercel.  
   These give you “who comes every day” and other stats without adding DB columns.

3. **Supabase Dashboard only:**  
   With `last_seen_at` you can run SQL in Supabase (e.g. “users active in last 7 days”) without using the Admin page.

---

## Viewing Firebase users in Admin

To show Firebase Auth users **inside** the Admin panel (not only in Firebase Console), the API must use the **Firebase Admin SDK** to list users.

1. **Firebase Console** → Project Settings → Service accounts → **Generate new private key**. Download the JSON.
2. In the **API** (`apps/api`), install: `npm install firebase-admin`.
3. Add to **API** env (e.g. in Vercel):
   - Either: `FIREBASE_SERVICE_ACCOUNT` = full JSON string (escape newlines or use a single line),  
   - Or: `GOOGLE_APPLICATION_CREDENTIALS` = path to the JSON file (only for local or when the host can read a file).
4. In the API, initialize Admin SDK with that credential, then implement e.g. `GET /admin/firebase-users` (protected with `adminMiddleware`) that calls `auth().listUsers()` and returns uid, email, creation time.
5. In the **Admin** page, add a tab or section that calls `GET /admin/firebase-users` (with the same Admin password) and displays the list.

Then you’ll see **all** Firebase Auth users in the Admin panel. You can still keep `GET /admin/users` for Supabase users (and last seen); the two lists can be shown side by side or merged by email.

---

## When to keep the Admin page

Keep the in-app Admin cabinet only if you want to:

- See the user list **inside the app** (e.g. from a shared device without opening Supabase), or
- Build more in-app admin tools later.

Otherwise you can ignore it and use **Supabase** for user analytics and **Firebase / Vercel** for product analytics.
