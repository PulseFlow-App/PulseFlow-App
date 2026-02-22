# Frontend & Testing (Web PWA)

## Do we have a frontend?

**Current state:**

- **Web (PWA)**  - `apps/web/` is the main client: Vite + React, login, dashboard, Body Signals, Work Routine, Pulse Lab, Admin cabinet. Deploy to Vercel/Netlify; see [Deploy](./deploy.md).
- **API**  - `apps/api/` is the backend (auth, body logs, insights). Deploy with Root Directory `apps/api`; see [Deploy](./deploy.md).
- **Spec**  - [`.specify/specs/001-pulse-platform/`](../.specify/specs/001-pulse-platform/) holds the full spec and plan.

The Expo mobile app has been removed; the project is web-first (PWA) plus API.

---

## How to run and test the web app

### Prerequisites

- Node.js 18+
- npm or yarn

### Run locally

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173. Sign in with any email (demo; no backend required). You get the dashboard with Body Signals and Work Routine blocks, plus links to Terms, Privacy, Lab, and Admin.

### Build for production

```bash
cd apps/web
npm run build
```

Output is in `dist/`. Serve over HTTPS for full PWA behavior (e.g. deploy to Vercel).

### Testing the PWA

- **Web (browser):** Open the app URL in Chrome, Safari, or Firefox. Test login, dashboard, Body Signals (log, trends), Work Routine (check-in, insights), Terms/Privacy/Disclaimer, Lab, Admin (with admin key), sign out.
- **PWA (installed):** Use “Add to Home Screen” (mobile) or “Install Pulse” (desktop Chrome). Open the installed app and verify the same flows.
- **Admin cabinet:** Set `VITE_API_URL` and `ADMIN_API_KEY` on the API; open `/admin`, enter the admin key, load users.

---

## $PULSE and the Lab

- **Token:** [Pump.fun](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump)  - Solana.
- **Lab:** The `/lab` page explains $PULSE, where to buy, and how to lock (lock tokens for as long as you want the paid tier). Set `VITE_LOCKING_URL` in the PWA project to show your locking link.
- Wallet connection for Premium verification can be added later (e.g. Solana wallet connect on web).

---

## Summary

| Question | Answer |
|----------|--------|
| **Do we have a frontend?** | Yes. **PWA** in `apps/web/`. |
| **How to test?** | `cd apps/web && npm install && npm run dev` → http://localhost:5173 |
| **Deploy?** | See [Deploy](./deploy.md). PWA and API are separate Vercel/Netlify projects. |

📖 See also: [Product](./product.md) | [Token Utility](./token-utility.md) | [Roadmap](./roadmap.md) | [Spec](../.specify/specs/001-pulse-platform/spec.md)
