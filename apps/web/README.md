# Pulse Web (PWA)

React web app for Pulse. PWA-ready (manifest + service worker via Vite PWA plugin). Use as the primary distribution instead of the iOS App Store; optionally wrap with Trusted Web Activity for Google Play.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **React Router** for `/` (login) and `/dashboard`
- **vite-plugin-pwa** for manifest, service worker, and install prompt

## Run locally

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173. Sign in with any email (demo; no backend required). You get the dashboard with Body Signals and Work Routine blocks (full logging, trends, check-ins).

**Using the API (auth sync, referrals, AI insights, points):** Start the API in another terminal — it uses **port 3002** by default:

```bash
cd apps/api
npm install
npm run dev
```

Then set the web app’s API URL: create `apps/web/.env` or `apps/web/.env.local` with:

```
VITE_API_URL=http://localhost:3002
```

Restart the web dev server so it picks up the env. If you see `ERR_CONNECTION_REFUSED` or "Can't reach the API", the API is not running or the URL/port is wrong (use 3002, not 3000, unless you set `PORT=3000` in the API).

## Build for production

```bash
npm run build
```

Output is in `dist/`. Serve over HTTPS for full PWA behavior (e.g. deploy to Vercel, Netlify).

## PWA icons

For "Add to Home Screen" and install prompt to show your icon, add:

- `public/icons/icon-192.png` (192×192)
- `public/icons/icon-512.png` (512×512)

Use any 192×192 and 512×512 PNG (e.g. in `apps/web/public/icons/`). If missing, the browser uses a default.

## Routes

| Path        | Description                    |
|------------|--------------------------------|
| `/`        | Login (email; session in localStorage) |
| `/dashboard` | Dashboard with block cards (Body Signals, Work Routine, Coming Soon) |
| `/dashboard/body-signals` | Body Pulse overview; links to Log and Trends |
| `/dashboard/body-signals/log` | Log sleep, energy, mood, etc. |
| `/dashboard/body-signals/trends` | Charts (7d/30d, metric selector) |
| `/dashboard/work-routine` | Routine Pulse, streak, check-in / insights |
| `/dashboard/work-routine/checkin` | 6-question check-in |
| `/dashboard/work-routine/insights` | Latest assessment and quick wins |
| `/terms`, `/privacy`, `/disclaimer` | Legal pages |
| `/admin` | Admin cabinet: list users (enter ADMIN_API_KEY; requires VITE_API_URL) |
| `/lab` | Pulse Lab: $PULSE, where to buy, how to lock (optional VITE_LOCKING_URL) |

## Testing: Web, PWA, and desktop

The app is set up so you can test the same build in all contexts:

| Context | How to test | What to check |
|--------|----------------|----------------|
| **Web (browser)** | Open the app URL in Chrome, Safari, Firefox (mobile or desktop). | Login, dashboard, Body Signals (log, trends), Work Routine (check-in, insights), Terms/Privacy/Disclaimer, sign out. No horizontal scroll; content centered on wide screens. |
| **PWA (installed)** | Use “Add to Home Screen” (mobile) or “Install Pulse” (desktop Chrome). Open the installed app. | Same flows as web. Status bar / notch use safe area; theme color matches; runs standalone without browser UI. |
| **Desktop** | Resize browser to full screen or install as desktop PWA. | Content has sensible max-width and is centered; keyboard Tab and Enter work; “Skip to main content” appears on first Tab. |

Details:

- **Viewport**: `width=device-width, initial-scale=1, viewport-fit=cover` for mobile and desktop.
- **Safe area**: `env(safe-area-inset-*)` padding so notched devices don’t clip content in PWA.
- **Focus**: Visible focus ring on links and buttons for keyboard users.
- **Touch**: Buttons have at least 44px height for tap targets.
- **Manifest**: `display_override` includes `standalone` and `window-controls-overlay` for desktop PWA; `orientation: any`; `scope: /`.

## Next steps

- **AI recommendations (Body Signals):** Set `VITE_API_URL` in your hosting env (e.g. Vercel/Netlify) and redeploy. The web app calls `POST /insights/body-signals` for insight/explanation/improvements. If unset, you get rule-based suggestions only. See `docs/why-ai-works-locally-but-not-deployed.md`.
- Connect to your API for auth/data: set `VITE_API_URL` and use it in `AuthContext` and any data fetching.
- Add Magic or wallet connect for web (separate SDKs).
- Deploy to your domain and optionally publish to Google Play via [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) / [PWABuilder](https://pwabuilder.com).
