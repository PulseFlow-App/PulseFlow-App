# User Data Storage — Secure Baselines & Profile

User data (body signals, routine check-ins, baselines, profile) must be stored **securely** and **per user** so we can build baselines and profiles over time.

---

## Principles

1. **Identity** — User is identified by **email sign-in** (no wallet required to use the app). Backend issues a **JWT** (or session token) after sign-in; all API requests use `Authorization: Bearer <token>`.
2. **Data keyed by user** — All stored data is scoped to `userId` (from JWT). No cross-user access.
3. **In transit** — HTTPS only.
4. **At rest** — Backend stores data in a database with encryption at rest; tokens and secrets in env, not in code.

---

## What We Store (Backend)

| Data | Purpose |
|------|--------|
| **User** | `userId`, `email`, `createdAt`; optional `walletAddress` after connect (for premium check). |
| **Body logs** | Sleep, energy, mood, hydration, stress, weight, notes — per day, per user. For baselines and Pulse Score history. |
| **Work routine check-ins** | Answers, timestamps — per user. For routine pulse and insights. |
| **Baselines** | Derived: rolling averages, personal norms (e.g. sleep baseline). Computed server-side from body logs + check-ins. |
| **Profile** | Preferences, timezone, optional goals. |

---

## API Contract (Authenticated)

All endpoints below require `Authorization: Bearer <accessToken>` (from sign-in). Backend decodes JWT to get `userId` and scopes all reads/writes to that user.

- **POST /auth/sign-in** — `{ email, password }` → `{ user: { userId, email }, accessToken }`
- **POST /auth/sign-up** — `{ email, password }` → `{ user, accessToken }`
- **GET /users/me** — Current user profile.
- **GET /users/me/body-logs** — List body logs (optional `?from=&to=`).
- **POST /users/me/body-logs** — Create body log (payload: same shape as mobile `BodyLogEntry` without `id`/`date`; server sets `id`, `date`, `userId`).
- **GET /users/me/work-check-ins** — List check-ins.
- **POST /users/me/work-check-ins** — Create check-in.
- **GET /users/me/baselines** — Personal baselines (sleep, energy, etc.) for AI and Pulse.
- **GET /premium/status** — `?wallet=<address>` → `{ isPremium }` (read-only chain check for $PULSE staking).

Mobile app: when `EXPO_PUBLIC_API_URL` is set and user is signed in, **sync** body logs and check-ins to the API (e.g. after each log or on focus). When offline or no API, keep local store and sync when online (optional for MVP).

---

## Mobile: Session Storage

- **Session** (userId, email, accessToken) is stored in **AsyncStorage** (MVP). For production, store **accessToken** in **expo-secure-store** and keep only non-sensitive user info in AsyncStorage, or use httpOnly cookies if the app uses a webview for auth.
- Never log or send passwords; send only hashed or via secure sign-in request.

---

## Security Checklist

- [ ] HTTPS only for API.
- [ ] JWT expiry and refresh (or short-lived session).
- [ ] Passwords hashed (e.g. bcrypt) on backend; never stored plain.
- [ ] Database encryption at rest; env for secrets.
- [ ] Rate limiting and abuse protection on auth and API.
- [ ] Premium check: backend verifies wallet staking (read-only) before returning `isPremium: true`.

---

📖 See also: [Frontend & Testing](./frontend-and-testing.md) | [Token Utility](./token-utility.md) | [Data Model / Privacy](../data-model/privacy.md)
