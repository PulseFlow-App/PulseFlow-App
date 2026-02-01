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

Open http://localhost:5173. Sign in with any email (demo; no backend required). You get the dashboard with Body Signals and Work Routine blocks (links are placeholders for now).

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

## Next steps

- Connect to your API: set `VITE_API_URL` and use it in `AuthContext` and any data fetching.
- Add Magic or wallet connect for web (separate SDKs).
- Implement Body Signals and Work Routine pages under `/dashboard/body-signals` and `/dashboard/work-routine` (or reuse logic from mobile).
- Deploy to your domain and optionally publish to Google Play via [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) / [PWABuilder](https://pwabuilder.com) (see `docs/pwa-and-google-play.md`).
