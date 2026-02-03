# PWA First, No iOS App Store + Google Play (Optional)

Strategy: ship **Pulse as a PWA** (Progressive Web App) so anyone can use it in the browser and "Add to Home Screen" without the Apple App Store. Optionally **register** a domain and publish on **Google Play** using a Trusted Web Activity (TWA) wrapper. Skip the iOS App Store to avoid Apple's requirements and review process.

---

## 1. PWA (Primary Distribution)

### What you get
- One URL (e.g. `https://pulseflow.site` or your domain). Users open it in Chrome, Safari, or any browser.
- **Installable**: "Add to Home Screen" on Android and iOS gives an app-like icon and fullscreen experience.
- No app store review for the PWA itself; you deploy when you want.
- Works on desktop too (same URL).

### What you need
- **HTTPS** – PWA must be served over HTTPS (required for service worker and install prompt).
- **Web app manifest** – `manifest.json` with name, short_name, icons, start_url, display (standalone), theme_color, background_color.
- **Service worker** (optional but recommended) – for offline/caching and installability; many tools generate it (e.g. Workbox, Vite PWA plugin).
- **Icons** – at least 192x192 and 512x512 for "Add to Home Screen" and install prompts.

### How to get there from your current repo
- The PWA lives in **`apps/web`** (Vite + React, manifest + service worker via vite-plugin-pwa). Deploy it to Vercel/Netlify and point your domain at the deployment.

Once the PWA is live on your domain, you can **register** it by:
- Submitting your site to search engines (Google Search Console, etc.).
- Setting up **Digital Asset Links** if you later publish on Google Play (see below).

---

## 2. “Register”

Interpretation that fits your message:
- **Domain registration** – Buy/register a domain (e.g. pulseflow.site) and point it to where the PWA is hosted (Vercel, Netlify, etc.).
- **PWA “registration”** – No formal store registration for a PWA; you just deploy and optionally add the site to directories (e.g. pwabuilder.com) or link it from your main site.
- **Google Play / other stores** – “Register” could mean creating a developer account and registering the app there; see Google Play section below.

---

## 3. Google Play (Optional) – Requirements

If you want Pulse on the **Google Play Store** (Android only), you have two main paths.

### Path 1: PWA as an app (Trusted Web Activity – recommended if you’re PWA-first)

You wrap your **existing PWA** in a minimal Android app that opens your PWA in a fullscreen Chrome (Trusted Web Activity). Users get “Pulse” from the Play Store, but it’s really your PWA.

**Requirements:**
- **Google Play Developer account** – One-time **$25 USD** registration. No annual fee for the account.
- **Developer identity** – Google may ask for verification (e.g. name, address, ID) depending on account type and region.
- **PWA already live** – Your PWA must be served over HTTPS with a valid **web app manifest** and (for TWA) **Digital Asset Links** so Google can verify that the Play app and the website belong to you.
- **Content and policy** – App must comply with [Google Play policy](https://support.google.com/googleplay/android-developer/answer/10788890) (content, privacy, security, etc.). For a wellness/utility app with optional wallet, you’ll need a **privacy policy URL** and, if you collect data, compliance with data policies. The Pulse web app includes **Terms of Service**, **Privacy Policy**, and **Disclaimer** in the footer and at stable URLs: `https://app.pulseflow.site/terms`, `/privacy`, `/disclaimer` (use these when registering the PWA or TWA in stores).

**How to build the Play package from your PWA:**
- Use **Bubblewrap** (Node.js CLI):  
  `npm i -g @bubblewrap/cli`  
  then `bubblewrap init --manifest=https://your-pwa-domain.com/manifest.json`  
  It generates an Android project, handles signing, and produces an app bundle (AAB) for Play.
- Or use **PWABuilder** (pwabuilder.com): point it at your PWA URL; it can generate a TWA Android project and optional store packages.

**Summary for TWA path:**
| Item | Requirement |
|------|-------------|
| Cost | $25 one-time (Play developer account) |
| Identity | Developer verification as required by Google |
| PWA | HTTPS, manifest, icons; Digital Asset Links for TWA |
| Policies | Privacy policy, Play policy compliance |
| Build | Bubblewrap or PWABuilder → upload AAB to Play Console |

---

## 4. What we’re *not* doing: iOS App Store

- **No iOS app submission** – Saves Apple Developer Program fee ($99/year), App Review, and iOS-specific store requirements.
- **iOS users** – They can use the **same PWA** in Safari and “Add to Home Screen”; no need for the App Store. Experience is “install” from the browser.

---

## 5. Suggested order of work

1. **Ship PWA** – Get the web app in `apps/web` live on HTTPS with manifest + icons + optional service worker (see [Deploy](./deploy.md)).
2. **Register domain** – Point your chosen domain to the PWA.
3. **(Optional) Google Play** – Create Play developer account ($25), set up Digital Asset Links for your PWA domain, use Bubblewrap (or PWABuilder) to build TWA, then submit the AAB in Play Console and complete store listing + policy forms.
