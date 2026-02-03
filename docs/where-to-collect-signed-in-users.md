# Where to collect the list of everyone who signed in

It depends **how** users sign in and **whether** you use a backend.

---

## 1. API with Postgres (email sign-up / sign-in)

If your **Pulse API** is deployed with **`DATABASE_URL`** set and users sign in (or sign up) via **email + password** against that API:

- **Everyone who has ever signed up** is stored in the **`users`** table in your Postgres database.
- **How to get the list:**

  **Option A – Query the database directly**  
  In your database provider’s SQL editor (Neon, Supabase, Railway, etc.) run:

  ```sql
  SELECT id, email, created_at
  FROM users
  ORDER BY created_at DESC;
  ```

  Export the result as CSV if the provider supports it.

  **Option B – Admin endpoint and Admin cabinet**  
  The Pulse API exposes **`GET /admin/users`** when Postgres is configured. It returns `{ users: [{ id, email, createdAt }, ...] }`. It is protected by **`ADMIN_API_KEY`**:

  1. **Get an admin key:** Generate it yourself (do not put it in frontend code). In a terminal run: `openssl rand -hex 32`. Copy the output.
  2. **Set it on the API:** In your API deployment (Vercel/Railway/Render), add **`ADMIN_API_KEY`** with that value in Environment Variables. Redeploy.
  3. **Use it:**
     - **Admin cabinet (recommended):** In the web app, open **`/admin`** (e.g. `https://app.pulseflow.site/admin`). Enter the same admin key when prompted and click to load the user list. The page shows all users in a table. Ensure **`VITE_API_URL`** is set for the PWA so the cabinet knows your API base URL.
     - **Or call the API directly:**  
       `curl -H "Authorization: Bearer YOUR_ADMIN_API_KEY" https://your-api.com/admin/users`
  4. If **`ADMIN_API_KEY`** is not set on the API, the endpoint returns 503. If the token is wrong, 401.

- **Note:** Only users who **signed up** (or signed in, if you later add “sign in creates user”) via the API are in this table. Magic-only or wallet-only sign-ins are not stored here unless you add your own logic to record them.

---

## 2. API without Postgres (in-memory)

If the API runs **without** `DATABASE_URL`, users are kept in an in-memory `Map`. They are **lost on every restart** and there is no persistent list. To collect sign-ins over time, set up Postgres and use the `users` table as above.

---

## 3. Web app only (no API)

If the **web app** is used **without** `VITE_API_URL`, sign-in is **localStorage only**: the app never sends credentials to a server. There is **no central list** of who signed in. To have a list, you need to point the web app at your API and have users sign in via the API (so they are stored in `users` in Postgres).

---

## 4. Mobile: Magic (email OTP or Google)

If users sign in with **Magic** (email OTP or “Sign in with Google”) and you **do not** use your own API for auth:

- **Magic Dashboard** ([dashboard.magic.link](https://dashboard.magic.link)) shows usage and may list or count authenticated users. Check their docs or dashboard for “Users” or “Logins.” You do **not** get a copy of the list in your own database unless you add a step (e.g. after Magic login, call your API to register the user).

- To **collect** those users in your own list, you can: after a successful Magic login, call your API (e.g. `POST /users/register` or `POST /auth/magic-callback`) with the user’s email (from Magic) and store them in your `users` table. Then the list is again in Postgres and you use the same “query or admin endpoint” approach as in section 1.

---

## 5. Mobile: wallet-only sign-in

If users sign in by **connecting a wallet** only (no email, no API):

- The app only has the wallet address in memory/localStorage. There is **no backend list** unless you add one (e.g. after wallet connect, call your API to register that address and store it in a table).

---

## Summary

| Sign-in method              | Where the list lives                          |
|----------------------------|-----------------------------------------------|
| API + Postgres (email)     | **Postgres `users` table** – query SQL or use admin endpoint. |
| API in-memory              | No persistent list.                          |
| Web only (no API)          | No list (localStorage only).                  |
| Magic only (no API)        | Magic Dashboard; your own list only if you record them in your DB. |
| Wallet only                | No list unless you record addresses in your API/DB. |

To have **one place** to collect everyone who ever signed in: use the **API with Postgres** for auth (or sync Magic/wallet users into the same DB) and then use the **`users`** table plus either direct SQL or the optional **`GET /admin/users`** endpoint.
