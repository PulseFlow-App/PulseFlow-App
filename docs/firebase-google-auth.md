# Firebase Google Sign-In (Web PWA)

The web app uses **Firebase Auth** for **Google-only sign-in** (no password). When Firebase is configured, the login page shows only “Sign in with Google”.

---

## 1. Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com) and create or select a project.
2. Add a **Web app** (</> icon). Register your app; note the **config object** (apiKey, authDomain, projectId, etc.).
3. In **Authentication** → **Sign-in method**, enable **Google**. Add your support email and save.

---

## 2. Where to find the values in Firebase

Firebase does **not** show names like `VITE_FIREBASE_API_KEY`. It shows a **config object** with keys `apiKey`, `authDomain`, etc. You copy those **values** into your `.env` using the names below.

**Steps:**

1. Open [Firebase Console](https://console.firebase.google.com) and select your project.
2. Click the **gear icon** next to “Project Overview” → **Project settings**.
3. Scroll to **“Your apps”**. If you have no Web app yet, click the **</> (Web)** icon to add one and register your app.
4. Under “Your apps” you’ll see your **Web app** (e.g. “Pulse” or the app nickname). Click it.
5. You’ll see **“SDK setup and configuration”** with a code snippet. Choose **“Config”** (not “npm”) so you see an object like:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     ...
   };
   ```
6. Copy each **value** (the part after the colon, in quotes) into your `.env` using the variable names in the table below.

| Firebase key in config | Put in your .env as |
|------------------------|---------------------|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |
| `measurementId` | `VITE_FIREBASE_MEASUREMENT_ID` (optional) |

---

## 3. Environment variables (apps/web)

In `apps/web/.env` (and in Vercel for production), set:

```env
VITE_FIREBASE_API_KEY=          # value of apiKey from Firebase config
VITE_FIREBASE_AUTH_DOMAIN=pulseflow-ca453.firebaseapp.com   # use exactly what Firebase Console shows (authDomain)
VITE_FIREBASE_PROJECT_ID=       # value of projectId
VITE_FIREBASE_STORAGE_BUCKET=   # value of storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=  # value of messagingSenderId
VITE_FIREBASE_APP_ID=           # value of appId
VITE_FIREBASE_MEASUREMENT_ID=   # value of measurementId (optional)
```

**Restart the dev server** after changing `.env`.

---

## 4. Authorized domains (Firebase Console)

In **Authentication** → **Settings** → **Authorized domains**, add:

- `localhost` (for dev)
- Your **auth domain** (e.g. `pulseflow-ca453.firebaseapp.com`) – usually already there
- `app.pulseflow.site` (so users can open the app from your custom domain)

---

## 5. Behaviour

- **With Firebase config:** Login shows “Sign in with Google” only. No password.
- **Without Firebase config:** Login shows “Continue with email” (demo mode, no backend).
- User is stored in `AuthContext` (email + Firebase UID as userId). No Magic wallet is created; wallet connect is only on the Lab page.

---

## 6. Sign-in doesn’t open Google / brings me back to my app

If you set `VITE_FIREBASE_AUTH_DOMAIN` to your app URL (e.g. `app.pulseflow.site`), the popup or redirect can open your app instead of Google. **Fix:** use the **Firebase default auth domain** from Firebase Console (e.g. `pulseflow-ca453.firebaseapp.com`). Set `VITE_FIREBASE_AUTH_DOMAIN=pulseflow-ca453.firebaseapp.com` in Vercel (and in `.env` for local), redeploy the PWA, and try again. Ensure that domain is in **Authorized domains**.

## 7. 404 for `/_/firebase/init.json` (redirect not completing)

If sign-in opens Google but then you see **`GET .../_/firebase/init.json 404 (Not Found)`** after choosing an account:

- The redirect lands on **authDomain** (e.g. `pulseflow-ca453.firebaseapp.com`). That origin must serve `/_/firebase/init.json`.

**Fix:** Deploy the built PWA to **Firebase Hosting** for the same project. Steps:

### 7a. One-time setup (Firebase CLI + project)

1. Install the Firebase CLI (if you don’t have it):
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and link the project:
   ```bash
   firebase login
   ```
   If your Firebase project is not `pulseflow-ca453`, edit the repo root **`.firebaserc`** and set `"default"` to your project ID.

3. The repo already has **`firebase.json`** at the root with:
   - `hosting.public` = `apps/web/dist`
   - SPA rewrite: all routes → `/index.html`

### 7b. Build and deploy

From the **repo root** (e.g. `PulseFlowApp/`):

1. Build the PWA (this also generates `_/firebase/init.json` from your env):
   ```bash
   cd apps/web && npm run build && cd ../..
   ```
   Or from repo root:
   ```bash
   npm run build --workspace=pulse-web
   ```
   if you use workspaces; otherwise the `cd` form is fine.

2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

3. When it finishes, your app (and `/_/firebase/init.json`) are served at **`https://pulseflow-ca453.firebaseapp.com`** (or your project’s URL). The auth redirect will load that file and sign-in can complete.

### 7c. Optional: run build + deploy in one go

From repo root:

```bash
cd apps/web && npm run build && cd ../.. && firebase deploy --only hosting
```

You only need to deploy to Firebase Hosting when you want the **auth redirect** to work on the `*.firebaseapp.com` domain. Your main app can still be on Vercel at `app.pulseflow.site`; users who open the app there will hit Google sign-in and then land on `pulseflow-ca453.firebaseapp.com` for the callback, then Firebase can redirect them back to your app.

---

See also: [Vercel env variables](./vercel-env-variables.md) for production.
