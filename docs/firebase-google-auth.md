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
VITE_FIREBASE_AUTH_DOMAIN=      # value of authDomain
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
- `app.pulseflow.site` (or your production domain)

---

## 5. Behaviour

- **With Firebase config:** Login shows “Sign in with Google” only. No password.
- **Without Firebase config:** Login shows “Continue with email” (demo mode, no backend).
- User is stored in `AuthContext` (email + Firebase UID as userId). No Magic wallet is created; wallet connect is only on the Lab page.

---

See also: [Vercel env variables](./vercel-env-variables.md) for production.
