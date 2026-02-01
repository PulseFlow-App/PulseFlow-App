# Frontend, Mobile Testing & Wallet Connectors

## Do we have a frontend?

**Current state:**

- **Mobile app** — `apps/mobile/` is the **Expo (React Native)** app: Body Signals, Work Routine, auth (Magic + Phantom), Premium (IAP). Run locally or share with testers (see below).
- **Web (PWA)** — `apps/web/` is a PWA-ready React app (login, dashboard, block placeholders). Deploy to Vercel/Netlify; see [Deploy](./deploy.md).
- **API** — `apps/api/` is the backend (auth, body logs, insights). Deploy with Root Directory `apps/api`; see [Deploy](./deploy.md).
- **Spec** — [`.specify/specs/001-pulse-platform/`](../.specify/specs/001-pulse-platform/) holds the full spec and plan.

There is **no separate "expo folder"** in the repo; the mobile app lives in `apps/mobile`. When you run `npx expo start`, a `.expo/` cache folder is created (gitignored).

---

## How to test the mobile app

### Prerequisites

- Node.js 18+
- npm or yarn
- **iOS:** Xcode (Mac) for simulator or device
- **Android:** Android Studio + emulator or device
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli` (optional; `npx expo` works)

### 1. Run with Expo Go (fastest)

Expo Go is the easiest way to run the app on a device or simulator **without** wallet native modules:

```bash
cd apps/mobile
npm install
npx expo start
```

- **On device:** Install “Expo Go” from App Store / Play Store, scan the QR code.
- **iOS Simulator:** Press `i` in the terminal (Mac with Xcode).
- **Android emulator:** Press `a` (Android Studio emulator running).

**Limitation:** Expo Go does **not** support Phantom’s native wallet SDK. For wallet connection you need a **development build** (see below).

### 2. Run on iOS Simulator

```bash
cd apps/mobile
npm install
npx expo run:ios
```

Requires Xcode. Uses the iOS Simulator; no physical device needed.

### 3. Run on Android emulator

```bash
cd apps/mobile
npm install
npx expo run:android
```

Requires Android Studio and an AVD. Uses the emulator.

### 4. Development build (for wallet connectors)

To use **Phantom** or other native wallet SDKs, you need a **custom development build** (Expo Go is not enough):

```bash
cd apps/mobile
npx expo prebuild
npx expo run:ios    # or run:android
```

Or use [EAS Build](https://docs.expo.dev/build/introduction/) for cloud builds:

```bash
npm install -g eas-cli
eas build --profile development --platform ios
eas build --profile development --platform android
```

Then install the built `.ipa` / `.apk` on device or simulator and test wallet connect there.

### 5. Sharing with testers

- **Remote (any network):** `cd apps/mobile && npx expo start --tunnel`. Share the QR code or `exp://` link; testers need **Expo Go** (iOS/Android). First time may prompt for `@expo/ngrok`.
- **Same Wi‑Fi:** `npx expo start` → share the QR code from the terminal.
- **Standalone (no Expo Go):** Use [EAS Build](https://docs.expo.dev/build/introduction/) (development or preview profile), then share the build link (e.g. TestFlight, download link).

### 6. E2E / automated tests

When you add tests (e.g. Detox, Maestro, or Jest + React Native Testing Library):

- **Unit/component:** `npm test` in `apps/mobile`
- **E2E:** Run against a simulator/emulator or EAS device farm; wallet flows can be mocked or use test wallets.

---

## Is the mobile app compatible with wallet connectors?

**Yes.** The app is designed to work with **Solana** wallets for **$PULSE** (Pump.fun). The spec and plan assume:

- **Read-only** chain use: check balance / staking for Premium.
- **No in-app token trading** (store compliance).
- **Wallet connection** in the mobile app (connect → verify ownership → gate Premium).

### Recommended: Solana wallets on React Native / Expo

| Connector | Use case | Expo Go? | Notes |
|-----------|----------|----------|--------|
| **Phantom** | Primary Solana wallet | No (dev build) | [Phantom React Native SDK](https://docs.phantom.com/sdks/react-native-sdk). Connect modal, `useAccounts`, sign messages. Requires custom dev build + [Phantom Portal](https://phantom.com/portal) App ID. |
| **WalletConnect v2** | Multi-wallet (Phantom, Solflare, etc.) | Possible with Expo Go | Generic; works with Solana wallets that support WalletConnect. Use `@walletconnect/modal-react-native` or Solana-specific WalletConnect packages. |
| **Deep link** | Open Phantom/Solflare app | Yes | Link to `phantom://` or wallet’s universal link; user signs in external app and returns. Simpler but less integrated UX. |

So:

- **Expo Go:** You can test app UI and flows; for “real” wallet connection use WalletConnect (if available for Solana on RN) or deep links. Phantom’s full SDK needs a **development build**.
- **Development build:** Full compatibility with **Phantom React Native SDK** and other native Solana wallet adapters.

### $PULSE (Pump.fun) integration

- **Token:** [Pump.fun](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump) — Solana.
- **In the app:** After wallet connect, use Solana RPC (e.g. `@solana/web3.js`) to read wallet’s $PULSE balance and/or staking state (read-only). No token contract to deploy.

### Suggested stack for mobile

- **Wallet connect:** `@phantom/react-native-sdk` (dev build) and/or WalletConnect v2 for Solana.
- **Chain reads:** `@solana/web3.js` (and/or existing backend that reads Solana; app can call your API instead of RPC from the client).
- **Auth:** Wallet address + optional signed message; backend issues session/JWT for API access and Premium checks.

---

## Summary

| Question | Answer |
|----------|--------|
| **Do we have a frontend?** | Yes. **Mobile** in `apps/mobile/` (Expo); **PWA** in `apps/web/`. No separate "expo folder"; `.expo/` is cache (gitignored). |
| **How to test the mobile app?** | `cd apps/mobile && npm install && npx expo start` (Expo Go), or `npx expo run:ios` / `run:android` for simulators; use a **dev build** for wallet SDKs. |
| **Share with testers?** | `npx expo start --tunnel` (remote) or same Wi‑Fi QR; or EAS Build for standalone. |
| **Wallet compatible?** | Yes. Solana wallets (Phantom, etc.) via Phantom React Native SDK (dev build) and/or WalletConnect; read-only for $PULSE / Premium. |

---

📖 See also: [Product](./product.md) | [Token Utility](./token-utility.md) | [Roadmap](./roadmap.md) | [Spec](../.specify/specs/001-pulse-platform/spec.md)
