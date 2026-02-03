# Why AI recommendations work locally but show placeholders when deployed

## What you see

- **Local testing**: You enter body signals (sleep, energy, mood, etc.) and see **AI-generated** insight, explanation, and “What to improve today.”
- **Deployed PWA**: You see **generic/rule-based** text or “Log your first entry…” and it feels like placeholders or “not working.”

## Why that happens

### 1. **Environment variables are baked in at build time**

- **Web (Vite)**  
  `VITE_API_URL` (and any `VITE_*` you use for AI) are read at **build time** and inlined into the JS bundle.  
  - Locally: `.env` with `VITE_API_URL` → dev server has the value → app can call your API.  
  - Deployed: if Vercel/Netlify (or your CI) **does not** have `VITE_API_URL` set in **Environment variables**, the built site has no API URL → only **rule-based** suggestions (or “log your first entry” if no data).

So: **no env vars in the environment that does the build ⇒ no AI in that build.**

### 2. **Data not persisting (e.g. PWA in another context)**

- **Local**: Same browser, same origin → `localStorage` has your logged body signals → you see score + insights.
- **Deployed PWA**: Different browser, incognito, or “Add to Home Screen” with a different origin can mean **empty** `localStorage` → you see “Log your first entry to see your Body Pulse” and no improvements. That can also look like “not working” or placeholders.

## What to do

### Web (Vite/PWA) – so the **deployed** site has AI

1. **Hosting (Vercel / Netlify)**  
   In the project’s **Environment variables** (for the build), add:
   - `VITE_API_URL` = your API base URL (e.g. `https://api.yoursite.com`).

2. **Redeploy**  
   Trigger a new build so the new env is baked in. The deployed PWA will then call `VITE_API_URL/insights/body-signals` and show AI recommendations when that endpoint returns `{ insight, explanation, improvements }`.

3. **Backend**  
   Your API must implement `POST /insights/body-signals` with the same contract the web app uses (see `apps/web/src/blocks/BodySignals/aiInsights.ts` and your API docs). If you don’t set `VITE_API_URL` or the endpoint isn’t there, the web app keeps using the **rule-based** fallback (no errors, just generic text).

### Optional: avoid “empty” feeling on first load

- Ensure the first-time / no-data state is clearly copy, e.g. “Log your first entry to see your Body Pulse” and a clear “Log Data” button, so users don’t think the app is broken when they have no data yet.

---

**Summary:**  
- **Local** = env in `.env` (or your shell) → app gets API URL → AI works.  
- **Deployed** = env must be set **where you build** (Vercel/Netlify env, CI env) and **build again** so the deployed app bundle contains those values.  
- Set `VITE_API_URL` in your hosting dashboard and redeploy so the live PWA is no longer “placeholders only.”
