# Auth Options  - Email Login Without Your Backend

You don’t need to run a backend to have **email-based login**. Here are the options, including Solana-friendly ones.

---

## Current setup (no backend)

The app uses **mock email login**: email + password are stored **only on the device** (AsyncStorage). No server, no cross-device sync. Fine for local testing; not for production or multiple devices.

---

## Solana & “account abstraction”

Solana doesn’t have built-in account abstraction (no ERC-4337–style standard yet). There are, however, **third-party tools** that give you:

- **Email-based auth** (magic link or OTP)
- **Solana wallet** creation or linking
- **No need for your own auth backend**

So you get “email login” and a Solana-ready identity without running auth yourself.

---

## Options for email login (no your backend)

| Tool | What you get | Solana? | Notes |
|------|----------------|--------|--------|
| **Magic** | Email OTP → login + embedded wallet | Yes | [Magic + Solana](https://docs.magic.link/embedded-wallets/blockchains/non-evm/solana). Passwordless; creates Solana wallet on first login. You use their API key in the app. |
| **Dynamic** | Email, social, wallet, passkeys | Yes | [Dynamic](https://dynamic.xyz)  - email sign-in, can link Solana wallet. JS/React SDK; React Native possible. |
| **Particle Network** | Social + email, “chain abstraction” | Yes | [Particle](https://developers.particle.network)  - social logins + optional AA; Solana supported. |
| **Firebase Auth** | Email/password, magic link, OAuth | No (generic) | No wallet; just email auth + JWT. Good if you only need “email login” and don’t care about Solana for auth. |
| **Supabase Auth** | Email/password, magic link, OAuth | No (generic) | Same idea as Firebase; JWT + user in Supabase. |

**Summary:**  
- **Solana + email, no your backend:** use **Magic** (email OTP + Solana embedded wallet) or **Dynamic** (email + optional Solana wallet).  
- **Just email login, no Solana for auth:** use **Firebase** or **Supabase** and keep wallet connect separate for $PULSE/premium.

---

## Magic (email OTP + Solana wallet)

- **Site:** [magic.link](https://magic.link)  
- **Docs (Solana):** [Embedded Wallets – Solana](https://docs.magic.link/embedded-wallets/blockchains/non-evm/solana), [Email OTP with Solana](https://magic.link/docs/guides/email-otp-with-solana)  
- **Flow:** User enters email → receives OTP → logs in; Magic creates/links a Solana wallet. You get a DID token (and wallet address) for that user.  
- **In the app:** You’d add `magic-sdk` and `@magic-ext/solana`, set `MAGIC_PUBLISHABLE_KEY` in `.env`, and replace the current mock sign-in with `magic.auth.loginWithEmailOTP({ email })`. No backend required on your side.

---

## Magic Server Wallets (IdP integration)

If you **already have an identity provider** (Auth0, Okta, custom JWT backend, etc.) and want Magic to **manage server-side wallets** for those users (enterprise-style, wallet keys never leave Magic’s TEE), use **Server Wallets** with your IdP.

### Flow

1. **Register your IdP with Magic**  
   Magic needs to trust JWTs from your provider. You send your provider’s **issuer**, **audience**, and **JWKS URI**; Magic returns a **provider ID**.

2. **Your backend** issues JWTs (or your IdP does). Users sign in via your existing login (e.g. Auth0, email/password on your API).

3. **Your backend** calls Magic’s APIs with that JWT (and your Magic secret key). Magic validates the JWT via your JWKS and creates/returns a server-side wallet for that identity.

So: **your IdP = who the user is**; **Magic = wallet creation/custody** tied to that identity.

### Register your provider (one-time)

Get your **Magic secret key** from the [Magic Dashboard](https://dashboard.magic.link), then:

```bash
curl -X POST 'https://tee.express.magiclabs.com/v1/identity/provider' \
  -H 'Content-Type: application/json' \
  -H 'X-Magic-Secret-Key: YOUR_MAGIC_SECRET_KEY' \
  -d '{
    "issuer": "https://your-auth-provider.com",
    "audience": "your-app-audience",
    "jwks_uri": "https://your-auth-provider.com/.well-known/jwks.json"
  }'
```

- **issuer**  - The IdP’s issuer claim (e.g. `https://your-tenant.auth0.com/` or your API origin).
- **audience**  - The audience your JWTs are issued for (e.g. your app’s client ID or API identifier).
- **jwks_uri**  - URL where Magic can fetch your IdP’s **public keys** (JWKS) to verify JWT signatures.

The response includes a **provider ID**. Use that when calling Magic’s Server Wallets APIs so Magic knows which IdP to validate against.

**References:** [Magic Server Wallets](https://magic.link/docs/server-wallets), [Magic Dashboard](https://dashboard.magic.link).

---

## How to set up an IdP (for Magic Server Wallets)

Your IdP must do three things:

1. **Issue JWTs** that your backend (or Magic) will receive.
2. **Expose a JWKS endpoint** (public keys) so Magic can verify those JWTs.
3. Use a **stable issuer** and **audience** you’ll register with Magic.

Below are exact steps for two common setups.

---

### Option A: Auth0 as IdP

1. **Create an Auth0 account and application**  
   - Go to [auth0.com](https://auth0.com) → Sign up / Log in.  
   - **Applications** → **Create Application** → e.g. “Pulse” → **Single Page Application** (or Native if you prefer).  
   - Note the **Domain** (e.g. `your-tenant.auth0.com`) and **Client ID**.

2. **Get issuer, audience, and JWKS URI**  
   - **Issuer:** `https://YOUR_TENANT.auth0.com/` (trailing slash; replace `YOUR_TENANT` with your Auth0 domain).  
   - **Audience:**  
     - Either use your **Client ID** as audience (if your API is the same Auth0 app).  
     - Or create an **API** in Auth0 (APIs → Create API), set an **Identifier** (e.g. `https://api.pulse.app`), and use that as **audience** in your token.  
   - **JWKS URI:** `https://YOUR_TENANT.auth0.com/.well-known/jwks.json`  
   - Test it: open `https://YOUR_TENANT.auth0.com/.well-known/jwks.json` in a browser; you should see a JSON object with `keys`.

3. **Configure Auth0 to put `audience` in the token**  
   - In your Auth0 **Application** or **API** settings, ensure the access token (or ID token, depending on what you send to Magic) includes the **audience** you chose.  
   - For **Access Token**: in **APIs** → your API → **Settings**, the **Identifier** is the audience. When clients request tokens with `audience: 'https://api.pulse.app'`, that value appears in the token’s `aud` claim.

4. **Register with Magic**  
   - Use the curl from the “Register your provider” section above.  
   - Set `issuer` = `https://YOUR_TENANT.auth0.com/`  
   - Set `audience` = your API identifier or Client ID (same as in the token).  
   - Set `jwks_uri` = `https://YOUR_TENANT.auth0.com/.well-known/jwks.json`  
   - Send the request; save the **provider ID** from the response.

5. **Use in your backend**  
   - User signs in with Auth0 (e.g. Lock, Auth0 React/React Native SDK).  
   - Your backend receives the JWT (access token or ID token).  
   - Your backend calls Magic’s Server Wallets API with that JWT and the **provider ID**; Magic validates the JWT via Auth0’s JWKS and returns/creates the server-side wallet.

---

### Option B: Custom backend (your own JWT issuer)

If you issue JWTs from your own API (e.g. after email/password check):

1. **Create a key pair for signing**  
   - Generate an **RS256** (or **ES256**) key pair.  
   - Example (RS256, PEM):  
     `openssl genrsa -out private.pem 2048`  
     `openssl rsa -in private.pem -pubout -out public.pem`  
   - Keep **private key** on the server (or in a secret manager); never expose it.  
   - You’ll serve the **public key** in JWKS format at `/.well-known/jwks.json`.

2. **Choose issuer and audience**  
   - **Issuer:** Your API’s public base URL, e.g. `https://api.yourapp.com`.  
   - **Audience:** Your app identifier, e.g. `https://app.yourapp.com` or `pulse-mobile`.  
   - Use the same values in every JWT you issue (`iss`, `aud` claims).

3. **Implement JWKS endpoint**  
   - Add a **GET** route, e.g. `/.well-known/jwks.json`, that returns a JWKS document.  
   - JWKS = JSON with a `keys` array; each key has `kty`, `use` (`sig`), `alg` (e.g. `RS256`), `kid`, and key material (`n`, `e` for RSA).  
   - Convert your **public** PEM to JWK (e.g. use a library: Node `jose`, or [pem-jwk](https://github.com/dannycoates/pem-jwk)).  
   - Example shape:  
     `{ "keys": [ { "kty": "RSA", "use": "sig", "alg": "RS256", "kid": "your-key-id", "n": "...", "e": "AQAB" } ] }`  
   - Ensure the route is **public** (no auth) so Magic can fetch it.

4. **Issue JWTs on login**  
   - When a user signs in (e.g. email + password), validate credentials, then sign a JWT with your **private key**.  
   - Include: `iss` (issuer), `aud` (audience), `sub` (user id), `exp` (expiry), and any claims your app needs.  
   - Return this JWT to the client (or use it only server-side and call Magic from your backend with it).

5. **Register with Magic**  
   - **Issuer:** `https://api.yourapp.com` (same as in the JWT).  
   - **Audience:** same as in the JWT.  
   - **jwks_uri:** `https://api.yourapp.com/.well-known/jwks.json`  
   - Run the curl; save the **provider ID**.

6. **Call Magic from your backend**  
   - When you need a server-side wallet for a user, pass the JWT (and provider ID) to Magic’s API; Magic will load your JWKS, verify the JWT, and create/return the wallet.

---

### Checklist (any IdP)

| Requirement | Auth0 | Custom backend |
|-------------|--------|-----------------|
| Issuer (stable URL) | `https://tenant.auth0.com/` | Your API base URL |
| Audience (in JWT) | API Identifier or Client ID | Your app/API identifier |
| JWKS at public URL | `/.well-known/jwks.json` built-in | Implement `GET /.well-known/jwks.json` |
| JWT signed with key in JWKS | Yes (Auth0 signs) | You sign with private key; public key in JWKS |

Once these are in place, use the **Register your provider** curl with your Magic secret key; then use the returned **provider ID** in Magic Server Wallets API calls.

---

## Recommendation

- **For now:** Keep **mock email login** (no backend, no data saving). No change needed.  
- **When you want real email login without running a backend:**  
  - **Solana-friendly:** Add **Magic** (email OTP + Solana wallet) or **Dynamic** (email + optional wallet).  
  - **Not Solana-specific:** Use **Firebase Auth** or **Supabase Auth** for email/password or magic link; keep Solana wallet connect only for premium/$PULSE.
- **When you have an existing IdP and want server-side wallets:** Use **Magic Server Wallets**; set up your IdP (Auth0 or custom) as above, register it with Magic, then call Magic’s APIs from your backend with the user’s JWT.

So: Solana doesn’t ship “account abstraction” as a protocol, but **Magic / Dynamic / Particle** give you email-style login and Solana wallets without your own auth server. With an **existing IdP**, **Magic Server Wallets** tie server-side wallets to that identity.
