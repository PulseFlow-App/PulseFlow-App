# Google Auth — Easy, No Passwords

Add **“Sign in with Google”** so users click once, no email/password.

- **Magic (recommended if you want Solana/wallet too):** See **[Magic + Google auth](magic-google-auth.md)** — one click Google, optional embedded wallet, no passwords.
- **Firebase:** Below — minimal setup, no backend required.

---

## Option 1: Firebase Auth (recommended — minimal setup)

**No backend required** for sign-in. You get a Google user (email, name, uid); store session in localStorage and optionally send the Firebase ID token to your API later to create/link users.

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add project** (or use existing).
2. In the project: **Build** → **Authentication** → **Get started** → **Sign-in method** → enable **Google** (turn on, set support email, Save).

### 2. Get config

**Project settings** (gear) → **Your apps** → **Add app** → **Web** (</>). Copy the `firebaseConfig` object (apiKey, authDomain, projectId, etc.).

### 3. Install in the web app

```bash
cd apps/web
npm install firebase
```

### 4. Env (don’t commit secrets)

In `apps/web/.env` (and in Vercel for production):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

(You can put the full config in env; the above are the minimum. `apiKey` is safe to expose in frontend for Firebase.)

### 5. Init Firebase and add Google sign-in

**`apps/web/src/lib/firebase.ts`** (create file):

```ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(config);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

**In your AuthContext** (or a small auth helper): trigger Google sign-in:

```ts
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

// Call this when user clicks “Sign in with Google”
const result = await signInWithPopup(auth, googleProvider);
const user = result.user;  // { email, displayName, uid, photoURL }
// Store in your app state + localStorage, e.g.:
// setUser({ userId: user.uid, email: user.email ?? '' });
```

**Login page:** add a button that calls that function. No email/password fields needed for Google.

### 6. Optional: use with your API

After Google sign-in, get the **ID token** and send it to your backend to create or link a user and get your own JWT:

```ts
const idToken = await result.user.getIdToken();
// POST to your API, e.g. POST /auth/google { idToken } → backend verifies with Firebase Admin SDK, returns your JWT
```

Backend: verify `idToken` with Firebase Admin SDK (e.g. `firebase-admin` in Node), then create/find user and issue your JWT. That way the same user exists in your DB and can use body logs, admin, etc.

---

## Option 2: Supabase Auth

Also easy, no passwords. You get a Supabase session; can sync users to your Postgres if you use Supabase.

1. [Supabase](https://supabase.com) → create project → **Authentication** → **Providers** → **Google** (enable, add OAuth client ID/secret from Google Cloud Console).
2. In Google Cloud Console: create OAuth 2.0 credentials (Web), add authorized redirect URI from Supabase (e.g. `https://xxx.supabase.co/auth/v1/callback`).
3. In the app: `npm install @supabase/supabase-js`, init Supabase with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then:

```ts
await supabase.auth.signInWithOAuth({ provider: 'google' });
// Listen to auth state: supabase.auth.onAuthStateChange((_, session) => { ... })
```

User is stored in Supabase; you can use Supabase as your only backend or copy user into your API DB.

---

## Summary

| Goal              | Easiest path                          |
|-------------------|----------------------------------------|
| Google only, no backend | **Firebase Auth** — enable Google, `signInWithPopup`, store user in app. |
| Google + your API/users | Firebase + send ID token to API; backend verifies with Firebase Admin, issues JWT. |
| Google + hosted DB      | **Supabase Auth** — enable Google, `signInWithOAuth`, users in Supabase (and optionally sync to your API). |

No passwords: user clicks “Sign in with Google”, approves in Google’s popup, and you get their email/uid. Store that in your session (and optionally in your backend) and you’re done.
