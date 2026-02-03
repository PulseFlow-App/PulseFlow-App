# Google Cloud: OAuth 2.0 credentials (detailed)

Step-by-step setup in Google Cloud Console so your app (e.g. Magic “Sign in with Google”) can use Google sign-in. You’ll get a **Client ID** and **Client Secret** to paste into the Magic Dashboard.

---

## 1. Open Google Cloud Console

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)**.
2. Sign in with the Google account you want to use for the project (can be a personal or workspace account).

---

## 2. Create or select a project

- **New project:** Top bar → click the **project dropdown** (next to “Google Cloud”) → **New Project** → enter a name (e.g. “Pulse” or “PulseFlow”) → **Create**.
- **Existing project:** In the same dropdown, select the project you want to use.

Make sure the correct project is selected (name shown in the top bar) before the next steps.

---

## 3. Configure the OAuth consent screen (required first)

You must set this up before creating OAuth credentials.

1. In the left sidebar: **APIs & Services** → **OAuth consent screen** (or go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)).
2. **User Type:**
   - Choose **External** if real users (not only people in your org) will sign in → **Create**.
   - (Internal is only for Google Workspace orgs.)
3. **App information (step 1):**
   - **App name:** e.g. `Pulse` or `PulseFlow`.
   - **User support email:** Your email (dropdown of the account you’re signed in with, or add one). Required.
   - **App logo:** Optional; you can skip (sometimes helps to skip to avoid extra Google verification).
   - **App domain (optional):** You can leave blank for now, or add:
     - Application home page: `https://app.pulseflow.site`
     - Application privacy policy: `https://app.pulseflow.site/privacy`
     - Application terms of service: `https://app.pulseflow.site/terms`
   - **Authorized domains:** Add `pulseflow.site` (and your custom domain if different). Do **not** add `localhost` here.
   - **Developer contact information:** Your email (required).
   - Click **Save and Continue**.
4. **Scopes (step 2):**
   - Click **Add or Remove Scopes**.
   - For “Sign in with Google” (email + basic profile), usually you need:
     - `.../auth/userinfo.email` — See your email address
     - `.../auth/userinfo.profile` — See your personal info (name, picture)
     - `openid` — OpenID Connect (often added automatically with the two above).
   - Select those (or “email”, “profile”, “openid” if listed that way) → **Update** → **Save and Continue**.
5. **Test users (step 3)** — only when app is in **Testing**:
   - **OAuth access is restricted to the test users listed on your OAuth consent screen.** While “Publishing status” is **Testing**, only the Gmail addresses you add here can sign in. Anyone else will see “Access blocked” or “This app isn’t verified”.
   - Add your own email and any testers’ emails → **Save and Continue**.
   - For **Production** (see step 6), this list is ignored and any Google user can sign in.
6. **Summary (step 4):**
   - Review → **Back to Dashboard**.
7. **Publishing status (later, when you’re ready for everyone):**
   - On the OAuth consent screen dashboard you’ll see **Publishing status: Testing**.
   - While in **Testing**, only test users (and sometimes limited total users) can sign in. For production, click **Publish App** and confirm. If you see “Access blocked: magic.link has not completed the Google verification process”, set status to **In production** (see [Magic’s Google doc](https://magic.link/docs/authentication/login/social-logins/social-providers/google#verification-process)).

---

## 4. Create OAuth client ID (Web application)

1. In the left sidebar: **APIs & Services** → **Credentials** (or [Credentials](https://console.cloud.google.com/apis/credentials)).
2. Click **+ Create Credentials** at the top → **OAuth client ID**.
3. **Application type:**  
   Select **Web application**.
4. **Name:**  
   e.g. `Pulse Web` or `Magic Google Login`. This is only for you to recognize it in the console.
5. **Authorized JavaScript origins** (optional but recommended):
   - Add the origins where your app runs (no trailing slash):
     - `http://localhost:5173` (Vite dev)
     - `https://app.pulseflow.site` (production)
   - Add any other origins (e.g. preview URLs) if needed.
   - These are the allowed origins for the OAuth flow.
6. **Authorized redirect URIs** (required):
   - Click **+ Add URI**.
   - Add **exactly** the callback URL your app (or Magic) will use. Must match what you pass as `redirectURI` in code and what you set in the Magic Dashboard.
   - Examples:
     - **Magic Login Widget:** add the URI Magic shows (e.g. `https://auth.magic.link/v1/oauth2/.../callback`).
     - **Custom UI:** Local: `http://localhost:5173/callback`, Production: `https://app.pulseflow.site/callback`.
   - **If you use Magic Dashboard “Test Connection”:** also add Magic’s test callback so the button works:
     - `https://dashboard.magic.link/app/social_login/test_connection_callback`
   - Add every URI you need (widget, your app, and test callback).  
   - **Important:** No trailing slash; exact path; `http` only for localhost.
7. Click **Create**.
8. A popup shows your **Client ID** (looks like `xxxxx.apps.googleusercontent.com`) and **Client Secret**.  
   - Copy both and store them somewhere safe (e.g. password manager).  
   - **Client Secret** is only shown once; if you lose it, create a new OAuth client ID and update Magic with the new pair.  
   - **Client ID** can always be accessed later: go to **[Google Auth Platform](https://console.cloud.google.com/apis/credentials)** (or APIs & Services → Credentials) and open the **Clients** tab; your OAuth client is listed there with its Client ID (you can copy it anytime). Only the Secret is one-time.

---

## 5. What to set in Magic vs Google

### In the Magic Dashboard (Social Login → Google)

- **Client ID:** Paste from Google (e.g. `xxxxx.apps.googleusercontent.com`).
- **Client Secret:** Paste from Google.
- **Login experience:** Choose **Magic Login Widget** or **Custom UI**.
- **Redirect URI:** Magic **shows** you the URI to use (for Widget it’s `https://auth.magic.link/v1/oauth2/.../callback`). You don’t type your app URL here when using the Widget — you copy Magic’s URI **into Google** (see below). For Custom UI you’d use your own callback (e.g. `https://app.pulseflow.site/callback`).
- Click **Save**, then **Test Connection**.

### In Google Cloud (Credentials → your OAuth client)

**Authorized redirect URIs** (required) — add these:

| URI | When you need it |
|-----|-------------------|
| `https://auth.magic.link/v1/oauth2/zqINpD1-on9T3zgll_h8W_CmUzZz8oAXxLwPmr8B-fk=/callback` | Magic Login Widget (copy the **exact** value from Magic step 4). |
| `https://dashboard.magic.link/app/social_login/test_connection_callback` | So “Test Connection” in Magic works. |
| `http://localhost:5173/callback` | Local dev (Custom UI only). |
| `https://app.pulseflow.site/callback` | Production app (Custom UI only). |

**Authorized JavaScript origins** (recommended) — add the **origins** (scheme + host, no path) where your app runs:

| Origin | When |
|--------|------|
| `http://localhost:5173` | Local dev. |
| `https://app.pulseflow.site` | Production. |

Do **not** add `https://auth.magic.link` or `https://dashboard.magic.link` as JavaScript origins unless Magic’s docs say to. Your app runs on your domain, so list your app’s origins.

---

## Quick checklist

| Step | Where | What you do |
|------|--------|-------------|
| 1 | Google Cloud Console | Sign in, select or create project |
| 2 | APIs & Services → OAuth consent screen | User type: External; App name, support email, dev contact; Scopes: email, profile, openid |
| 3 | OAuth consent screen | (Optional) Publish app when ready so all users can sign in |
| 4 | APIs & Services → Credentials → Create Credentials | OAuth client ID → Web application → Name → Authorized redirect URIs = your callback URL(s) |
| 5 | After Create | Copy Client ID and Client Secret → paste into Magic Dashboard → set same redirect URI → Save |

---

## Common issues

- **“Redirect URI mismatch” / “แอปไม่เป็นไปตามนโยบาย OAuth 2.0”**  
  The `redirect_uri` Google received must match **exactly** one of the “Authorized redirect URIs” in Google (scheme, host, path; no trailing slash). If you use Magic’s **Test Connection** in the dashboard, add `https://dashboard.magic.link/app/social_login/test_connection_callback` to Google’s list as well. See [Google’s redirect URI mismatch doc](https://developers.google.com/identity/protocols/oauth2/web-server#authorization-errors-redirect-uri-mismatch).

- **“Access blocked: magic.link has not completed the Google verification process”**  
  Set the OAuth consent screen **Publishing status** to **In production** (see step 3.7 and [Magic’s doc](https://magic.link/docs/authentication/login/social-logins/social-providers/google#verification-process)).

- **Client Secret lost**  
  Create a new OAuth client ID in Google, copy the new Client ID and Client Secret, and update the Magic Dashboard with the new values. You can delete the old client if you no longer need it.

- **Only some users can sign in / “This app isn’t verified” for others**  
  While the OAuth consent screen is in **Testing**, only the **test users** you added on the consent screen (step 3.5) can sign in. Add their Gmail addresses there, or set **Publishing status** to **In production** to allow any Google user (see step 3.7).
