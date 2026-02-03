# Magic + Google Auth — Easy, No Passwords

Use **Magic** so users can **“Sign in with Google”**: one click, no password. Magic can also create/link a Solana wallet for them (optional). This guide is for the **web PWA** (`apps/web`).

---

## 1. Magic Dashboard

1. Go to [dashboard.magic.link](https://dashboard.magic.link) and sign in (or create an account).
2. Create an app or select the one you use for Pulse.
3. In the sidebar: **Social Login** → turn **Google / Gmail** **On**.
4. You’ll need to paste a **Client ID** and **Client Secret** from Google (see step 2). Leave the dashboard open.

---

## 2. Google Cloud Console (OAuth credentials)

1. Open [Google Cloud Console](https://console.cloud.google.com) → select or create a project.
2. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
3. If asked, configure the **OAuth consent screen** (User type: External, add your app name and support email). For testing you can leave “Testing”; for production set “Publishing status” to **In production** (see [Magic’s Google doc](https://magic.link/docs/authentication/login/social-logins/social-providers/google#verification-process) if you hit “Access blocked”).
4. Application type: **Web application**.
5. **Authorized redirect URIs** — add:
   - Your **callback URL**, e.g. `https://app.pulseflow.site/callback` (or `http://localhost:5173/callback` for local).
   - If Magic gives you a “Magic Login Widget” redirect URI in the dashboard, add that too.
6. Create → copy the **Client ID** and **Client Secret**.

---

## 3. Back to Magic Dashboard

1. **Social Login** → **Google / Gmail**.
2. Paste **Client ID** and **Client Secret** from Google.
3. If you use **redirect** (recommended for web): set **Redirect URI** to your app’s callback, e.g. `https://app.pulseflow.site/callback`. Copy this exact value and ensure it’s the same in Google’s “Authorized redirect URIs”.
4. Click **Save** → **Test Connection** to confirm.

---

## 4. Allowed Origins & Redirects (Magic Dashboard)

Magic requires an **allowlist** of domains that can use your API key (outside localhost). In the Magic Dashboard, open your app → **Settings** (or the section where you see **Allowed Origins & Redirects** / **Domain allowlist**).

Add:

| Type | Value | Use |
|------|--------|-----|
| **Origin (domain)** | `http://localhost` or `http://localhost:5173` | Local dev (you may already have `http://localhost`). |
| **Origin (domain)** | `https://app.pulseflow.site` | Production PWA. |
| **Redirect** (if listed) | `http://localhost:5173/callback` | Local callback (Custom UI). |
| **Redirect** (if listed) | `https://app.pulseflow.site/callback` | Production callback (Custom UI). |

- **Origins** = scheme + host (e.g. `https://app.pulseflow.site`). No path, no trailing slash. These are the allowed origins for your frontend.
- **Redirects** = full callback URLs if Magic lets you restrict redirect targets. If you use **Magic Login Widget**, the redirect goes to Magic’s URL (`auth.magic.link`), so you might only need origins; add your app’s callback URLs if you use Custom UI and the dashboard has a redirect allowlist.

Without your production domain in the allowlist, Magic will block requests from `https://app.pulseflow.site` in production.

---

## 5. Get your Magic publishable key

In Magic Dashboard: **Settings** or **API Keys** → copy the **Publishable key** (starts with `pk_`). You’ll use it in the app as `VITE_MAGIC_PUBLISHABLE_KEY`. Never put the **Secret key** in the frontend.

---

## 6. Install in the web app

```bash
cd apps/web
npm install magic-sdk @magic-ext/oauth2
```

---

## 7. Env

In `apps/web/.env` (and in Vercel for production):

```env
VITE_MAGIC_PUBLISHABLE_KEY=pk_live_xxxx   # or pk_test_xxxx
```

Callback URL for local dev: `http://localhost:5173/callback`. For production: `https://app.pulseflow.site/callback` (or your real PWA URL). Add both in Google’s redirect URIs if you test both.

---

## 8. Code (Vite + React)

**Init Magic** (e.g. `apps/web/src/lib/magic.ts`):

```ts
import { Magic } from 'magic-sdk';
import { OAuthExtension } from '@magic-ext/oauth2';

const key = import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY;
if (!key) throw new Error('VITE_MAGIC_PUBLISHABLE_KEY is required for Magic');

export const magic = new Magic(key, {
  extensions: [new OAuthExtension()],
});
```

**Start Google login** (e.g. from your Login page):

```ts
import { magic } from '../lib/magic';

const handleGoogleLogin = async () => {
  await magic.oauth2.loginWithRedirect({
    provider: 'google',
    redirectURI: `${window.location.origin}/callback`,
  });
};
```

**Callback route** (`/callback`): after Google redirects back, read the result and create your app session:

```ts
import { magic } from '../lib/magic';

// Run this on the /callback page (e.g. in a useEffect)
const result = await magic.oauth2.getRedirectResult();
// result.magic.idToken   → Magic DID token (for backend verification if needed)
// result.magic.userMetadata → { email, publicAddress?, ... }
// result.oauth.userInfo  → provider-specific profile

const email = result.magic.userMetadata?.email ?? result.oauth?.userInfo?.email ?? '';
// Store in your AuthContext: setUser({ userId: result.magic.userMetadata.publicAddress ?? email, email })
// Then redirect to /dashboard
```

- **Redirect URI** must be exactly the same in: (1) `loginWithRedirect({ redirectURI })`, (2) Google Cloud “Authorized redirect URIs”, and (3) Magic Dashboard if you set it there.

---

## 9. Optional: backend (your API)

To create or link a user in your DB and issue your own JWT:

1. Send `result.magic.idToken` (DID token) to your API (e.g. `POST /auth/magic` with `{ didToken }`).
2. Backend uses [Magic Admin SDK](https://magic.link/docs/api/admin-sdks/node) to verify: `magic.users.getMetadataByToken(didToken)` → get email, wallet address, etc.
3. Backend creates or finds user, issues your JWT; frontend stores that JWT and uses it for authenticated requests.

If you skip this, the app can stay “session-only” with Magic (email/wallet from `getRedirectResult` stored in localStorage and AuthContext).

---

## Summary

| Step | Where | What |
|------|--------|------|
| 1 | Magic Dashboard | Enable Google in Social Login |
| 2 | Google Cloud | Create OAuth 2.0 Web client; add redirect URI (e.g. `https://app.pulseflow.site/callback`) |
| 3 | Magic Dashboard | Paste Google Client ID + Secret; set redirect URI; Save |
| 4 | Magic Dashboard | Copy Publishable key → `VITE_MAGIC_PUBLISHABLE_KEY` |
| 5 | apps/web | `npm install magic-sdk @magic-ext/oauth2` |
| 6 | Login page | Button that calls `magic.oauth2.loginWithRedirect({ provider: 'google', redirectURI })` |
| 7 | `/callback` route | `magic.oauth2.getRedirectResult()` → read email/userMetadata → set user in AuthContext → redirect to `/dashboard` |

No passwords: user clicks “Sign in with Google”, approves in Google’s page, and Magic redirects back with the user’s email (and optional wallet). Use [Magic’s Google doc](https://magic.link/docs/authentication/login/social-logins/social-providers/google) and [OAuth implementation](https://magic.link/docs/authentication/login/social-logins/oauth-implementation) for more detail.

---

## Do I need the “Configure your project” / getOrCreateWallet snippet?

**No — not for the flow in this guide.**

The snippet that calls `https://tee.express.magiclabs.com/v1/wallet` with `Authorization: Bearer YOUR-AUTH-PROVIDER-JWT`, `X-OIDC-Provider-ID`, etc. is for **Magic Server Wallets** (“Bring your own IdP”): you already have your own auth (e.g. your backend issues JWTs after Google login), and you **register that IdP with Magic** so Magic can create/return a wallet for each user when you pass their JWT. You’d use that if auth lives entirely in your app/backend and you only want Magic for wallet creation.

**For “Sign in with Google” via Magic’s client SDK** (this doc):

- The user signs in **through Magic** (Magic’s OAuth extension + Google). Magic handles the redirect and returns the user (and wallet) via `getRedirectResult()`. You don’t call `tee.express.magiclabs.com/v1/wallet` yourself; Magic creates or links the wallet as part of the social login.
- You **do not** need to register an OIDC provider or use `X-OIDC-Provider-ID` for this flow.
- You only need: Magic publishable key, Google OAuth credentials, and the client code (loginWithRedirect + callback with getRedirectResult).

So you can **skip** the “Configure your project” step that shows the `getOrCreateWallet` snippet unless you’re intentionally using Server Wallets / your own IdP.
