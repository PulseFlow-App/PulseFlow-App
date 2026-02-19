# Referrals: why you might not see points

When someone **completes sign-in** using your invite link, you earn **100 referral points**. Points are only granted when the referred person has fully signed in (their app calls `POST /referrals/complete` after auth). If they see an error and never finish sign-in, no points are awarded.

## Referral link opened but friend couldn’t sign in

If a friend opens your link and gets **“Unable to process request due to missing initial state”** (or similar), that’s usually:

- **In-app browsers** (e.g. WhatsApp, Instagram): sign-in redirects can fail because of storage partitioning.  
  **Fix:** Ask them to open the invite link in **Safari or Chrome** (copy the link and paste in the browser), then sign in again.
- **Firebase** shows this when `signInWithRedirect` is used in a context where `sessionStorage` is inaccessible or cleared.

So: **points only count when they complete sign-in.** If they didn’t, you won’t see referral points, and that’s expected.

## 1. API must use a database

Referrals are stored only when the API has **Postgres** (i.e. `DATABASE_URL` is set). Without it, the API returns an error and the referral is not recorded.

- **Local:** Set `DATABASE_URL` in `apps/api/.env`.
- **Deployed:** Set `DATABASE_URL` in the API project’s environment (e.g. Vercel → API project → Environment Variables).

See [setup-database.md](./setup-database.md) for creating tables (including `referral_points` on `users` and the `referrals` table).

## 2. You must exist in the database before they sign up

The API looks up the referrer by the code in the invite link (your user id). That id comes from **auth sync**: when you sign in, the app calls `POST /auth/sync`, which creates or updates your row in `users`.

- **You** (the inviter) must have signed in at least once **with the API reachable** (correct `VITE_API_URL` and API running with `DATABASE_URL`) so your user row exists.
- If you only ever signed in when the API was down or not configured, you won’t be in the DB. When your friend signs up, the API returns “Invalid referrer code” and the app may retry a few times. **Fix:** Sign in again (with the API and DB working); then the next time someone uses your link, it can succeed.

## 3. Points refetch when you return to the Dashboard

The Dashboard loads points when it mounts and when streak/check-ins change. It also **refetches points when you switch back to the tab** (visibility change), so referral points should appear shortly after your friend signs up if you return to the Pulse tab. If you don’t see them, refresh the page once.

## Summary

| Cause                         | What to do |
|------------------------------|------------|
| No `DATABASE_URL`             | Set it for the API and create the DB tables. |
| Referrer not in DB            | Sign in once with API + DB working so `/auth/sync` creates your user. |
| Points not updating on screen| Switch to another tab and back, or refresh the Dashboard. |
