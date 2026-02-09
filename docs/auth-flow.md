# PulseFlow auth flow (confirmed)

Use this to confirm how auth works and where users are stored. **This app does not use Supabase Auth.**

---

## 1. Auth system

| Question | Answer |
|----------|--------|
| **Supabase Auth or custom?** | **Custom.** The app uses **Firebase Auth** (Google sign-in) and an optional **email demo** (email only, stored in localStorage). Supabase is used only as **Postgres** (database). |
| **Session / JWT** | Login succeeds in the app (Firebase session or localStorage). The app does **not** use Supabase JWT. The API uses its own JWT (JWT_SECRET) only for protected API routes (e.g. body logs); login itself does not require an API JWT. |

---

## 2. Which table has users?

| Question | Answer |
|----------|--------|
| **Expected table** | **`public.users`** only. This is a **custom table** created by our setup SQL (see `docs/setup-database.md`). |
| **`auth.users`** | **Not used.** This app does not use Supabase Auth. There is no sign-up or sign-in via Supabase. Rows in `auth.users` (if any) are unrelated to this app’s login. |
| **`public.users`** | This is the **only** user table for the app. It should be populated by the **API** when users log in or complete referrals (see below). |

---

## 3. How rows get into `public.users`

Rows are created **only by the API** (Express app), using a **direct Postgres connection** (DATABASE_URL). The API connects as the database user (e.g. `postgres`), which **bypasses RLS** in Supabase.

| Mechanism | When | Endpoint | What happens |
|-----------|------|----------|--------------|
| **Login sync** | After user signs in (Google or email demo) | `POST /auth/sync` | Frontend calls with `{ email, userId? }`. API creates a row in `public.users` if one does not exist (random password hash, no sign-in via API). |
| **Referral completion** | When user has a referral code and signs in | `POST /referrals/complete` | API creates user if not exists, then inserts into `referrals`. |
| **API sign-up** | Legacy / alternative flow (not used by current web UI) | `POST /auth/sign-up` | Email + password; API creates row in `public.users`. |

**No Supabase trigger.** We do **not** use a trigger on `auth.users` to create `public.users` rows. We do not use Supabase Auth at all. All inserts into `public.users` are done by the **API** over the direct Postgres connection.

---

## 4. RLS and inserts

- **RLS** is **enabled** on `public.users` (and `body_logs`, `referrals`) with **no policies** for `anon`/`authenticated`, so PostgREST cannot read or write these tables.
- The **API** uses a **direct Postgres connection** (DATABASE_URL). In Supabase, that role **bypasses RLS**, so the API can INSERT/UPDATE/SELECT on `public.users` without any RLS policy. RLS does **not** block the API.

---

## 5. Checks you can run

**Are there rows in `auth.users`?**  
- Optional. For this app it doesn’t matter; we don’t use Supabase Auth. If you want to check:  
  `SELECT count(*) FROM auth.users;`

**Are there rows in `public.users`?**  
- This is what matters.  
  `SELECT id, email, created_at FROM public.users ORDER BY created_at DESC LIMIT 20;`

**Triggers on `auth.users`?**  
- Not needed. We don’t use Supabase Auth. If you run:  
  `SELECT * FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;`  
  any result is unrelated to how this app fills `public.users`.

**If `public.users` is empty after login**  
- Confirm the API is reachable (VITE_API_URL in the web app).
- Confirm the API has DATABASE_URL set and can connect to Postgres.
- After login, the frontend calls `POST /auth/sync`; check browser Network tab for that request and for 201/200 or 4xx/5xx.
- Check API logs for `[auth/sync]` (success: "User created" or "User exists"; failure: "Error" with code/message).

---

## 6. Quick diagnose (run in order)

1. **Browser → Network:** After login, find `POST .../auth/sync`.  
   - Not present → fix **VITE_API_URL** or the client (sync runs after Firebase or email sign-in).  
   - Present: note **status** and **response body**.

2. **Response 200/201:** Sync succeeded. Check `public.users` in the same DB the API uses (same DATABASE_URL).  
   - Response body includes `created: true` (new row) or `created: false` (already existed).

3. **Response 4xx/5xx:** Open response body (API returns `message` and optional `code`).  
   - 400 + `EMAIL_REQUIRED` → payload missing email.  
   - 500 + `SYNC_FAILED` or DB error code → check API logs and DATABASE_URL.

4. **API logs:** After reproducing, look for `[auth/sync]` lines:  
   - "User created" / "User exists" = success.  
   - "Error:" with code = DB or constraint issue; fix DATABASE_URL or schema.

5. **Same DB:** Ensure the Supabase project (and connection string) used by the API is the one where you run `SELECT * FROM public.users`.

6. **DB connectivity from API (Vercel):** Call **`GET https://YOUR_API_URL/health/db`** (no auth).  
   - **200** `{ ok: true }` → API can reach Postgres; if `/admin/users` still 500, check API logs for the actual error.  
   - **503** `{ ok: false, error: "no_database" }` → DATABASE_URL is not set in the API project (or wrong Vercel project).  
   - **503** `{ ok: false, error: "ENOTFOUND" | "ECONNREFUSED" | "ETIMEDOUT" }` → DB unreachable from Vercel (wrong URL, Supabase paused, or network).  
   After changing env vars on Vercel, **redeploy** the API so the new values are used.

---

## 7. Summary

- **Auth:** Firebase (Google) or email demo (localStorage). No Supabase Auth.
- **User table:** `public.users` only (custom table).
- **Who inserts:** The API only, via `POST /auth/sync` (and referrals/sign-up). No trigger on `auth.users`.
- **RLS:** Enabled on `public.users` with no policies; API bypasses RLS via direct connection.
