# Next Steps

Prioritized list after the policy-safe redesign (Premium = IAP, $PULSE off-app). Pick what matters first.

---

## 1. Ship the PWA (primary distribution)

- [ ] **Finish `apps/web`**
  - Add PWA icons: `public/icons/icon-192.png` and `icon-512.png` (e.g. resize from `apps/mobile/assets/icon.png`).
  - Optional: connect web login to your API (`VITE_API_URL`) so web and mobile share auth.
- [ ] **Deploy** the web app to Vercel/Netlify (HTTPS required for PWA).
- [ ] **Register domain** (e.g. pulseflow.site) and point it at the deployment.
- [ ] Test **Add to Home Screen** on iOS and Android.

**Docs:** [How to deploy](./deploy.md) | [PWA and Google Play](./pwa-and-google-play.md) | [apps/web README](../apps/web/README.md)

---

## 2. Mobile app: Premium IAP and polish

- [ ] **Implement in-app purchase (IAP)** for Premium.
  - Use **Expo In-App Purchases** or **react-native-iap**; when purchase completes, call `setPremiumUnlocked(true)` (or have backend set subscription and app refresh).
  - Replace the demo `subscribeToPremium()` in `PremiumContext` with the real IAP flow.
- [ ] **Backend:** add a **subscription** endpoint (e.g. `GET /users/me/subscription`) so the app can restore premium on login (Apple/Google receipt or your own subscription record).
- [ ] Remove or repurpose **StakePremiumScreen** if you no longer need it (About Pulse is the replacement in the nav).
- [ ] Optional: **Wallet screen** – keep for “copy address / deposit SOL” but ensure no copy says “stake to unlock”; it’s for transactions only.

**Docs:** [App Store copy](./app-store-copy.md)

---

## 3. Backend: subscription and protocol

- [ ] **Subscription model:** store which users have an active Premium subscription (by user id + Apple/Google receipt or your plan id). Expose `GET /users/me/subscription` or fold into `GET /users/me`.
- [ ] **Premium check in app:** app calls backend after login (and after IAP) to get `isPremium`; set `setPremiumUnlocked(true)` from that. No wallet/staking in this flow.
- [ ] **Protocol credits (off-app):** if $PULSE holders get extra capacity, implement that in the backend (e.g. by wallet or by a separate “credits” table). App only sees “capacity” or “premium”; never mention token in app.

**Docs:** [User data storage](./user-data-storage.md) | [Setup database](./setup-database.md)

---

## 4. Token / protocol (off-app)

- [ ] **Governance:** set up a simple voting flow (web or Farcaster): which block to ship next, metrics to prioritize. Document in `docs/token-utility.md` and link from pulseflow.site.
- [ ] **Pulse Lab (web):** optional “inner lab” for $PULSE holders: raw dashboards, prompt templates, experiments. Web-only; no link from the app that says “token”.
- [ ] **Public messaging:** use “Pulse is an app you can use every day. $PULSE is how the system evolves.” on website and community.

**Docs:** [Token utility (policy-safe)](./token-utility.md) | [App / Protocol / Token diagram](./app-protocol-token-diagram.md)

---

## 5. Google Play (optional)

- [ ] When PWA is live: create **Google Play developer account** ($25 one-time).
- [ ] Use **Bubblewrap** or **PWABuilder** to build a TWA from your PWA URL; upload AAB to Play Console.
- [ ] **Store listing:** use [App Store copy](./app-store-copy.md) (no crypto/staking in description).
- [ ] **Digital Asset Links** for your domain so Play can verify the TWA.

**Docs:** [PWA and Google Play](./pwa-and-google-play.md)

---

## 6. Ongoing

- [ ] **Roadmap:** align [roadmap.md](./roadmap.md) with policy-safe token utility (Premium = IAP; token utility = protocol credits, governance, Lab).
- [ ] **Analytics:** add simple events (e.g. sign-in, block open, subscribe) for product decisions.
- [ ] **Body Signals / Work Routine on web:** if you want parity, port block logic to `apps/web` (or reuse via API); block placeholders already exist.

---

## Quick reference

| Goal | Action |
|------|--------|
| **Ship something fast** | Deploy PWA (`apps/web`), add icons, point domain. |
| **Monetize on mobile** | Implement IAP for Premium, backend subscription endpoint. |
| **Token utility** | Governance + Pulse Lab on web; protocol credits in backend. |
| **Android store** | TWA from PWA (Bubblewrap/PWABuilder) + Play Console. |
