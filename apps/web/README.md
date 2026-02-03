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

## Build for production

```bash
npm run build
```

Output is in `dist/`. Serve over HTTPS for full PWA behavior (e.g. deploy to Vercel, Netlify).

## PWA icons

For "Add to Home Screen" and install prompt to show your icon, add:

- `public/icons/icon-192.png` (192×192)
- `public/icons/icon-512.png` (512×512)

You can resize `apps/mobile/assets/icon.png` or use any PNG. If missing, the browser uses a default.

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

- Connect to your API: set `VITE_API_URL` and use it in `AuthContext` and any data fetching.
- Add Magic or wallet connect for web (separate SDKs).
- Deploy to your domain and optionally publish to Google Play via [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) / [PWABuilder](https://pwabuilder.com).
