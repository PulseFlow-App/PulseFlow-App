# Pulse Mobile App

**Expo SDK 54 (React Native)** app with block-based UI. Active blocks:

- **Body Signals** — Weight, sleep, energy & mood → Body Pulse score & trends (native).
- **Work Routine** — Daily check-ins (6 questions: sleep, energy, meals, exercise, stress, focus), rule-based insights, streaks & weekly progress. No wallet, no cooldown.

**Icons:** Replace `assets/icon.png` and `assets/adaptive-icon.png` with 1024×1024 PNGs before store builds. Use a **transparent** PNG for `assets/logo.png` so the header logo looks correct on the dark background.

**Auth:** Sign in with **Magic** (email OTP + Solana wallet) when `EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY` is set, or with **email & password** (API or mock). Session stored in AsyncStorage; set `EXPO_PUBLIC_API_URL` for backend sign-in and JWT.

**Premium:** Optional — user taps "Connect wallet to show premium" in Profile, then can go to "Stake to reach premium" to stake $PULSE. When staking is verified (or demo "I've staked"), Premium unlocks and a success modal appears. Full wallet connect requires a development build (Phantom SDK).

**Body Signals (MVP):** Insight, explanation, and "What to improve" suggestions use **AI** when configured. Pulse Score stays rule-based (never AI-generated).

### AI recommendations (MVP)

To get AI-generated suggestions on the Body Signals overview:

1. **Option A — Backend API (recommended for production)**  
   Set `EXPO_PUBLIC_API_URL` to your API base URL (e.g. `https://api.pulseflow.site`).  
   The app will `POST` to `/insights/body-signals` with today’s signals; your backend calls your LLM and returns `{ insight, explanation, improvements }`.  
   See `apps/ai-engine/prompts/body-signals-insights.md` for the contract and prompt.

2. **Option B — Google AI (Gemini) — recommended for quick MVP**  
   In `apps/mobile`, create a `.env` file with:
   ```bash
   EXPO_PUBLIC_GOOGLE_AI_API_KEY=your-google-ai-key
   ```
   Get a free key at [Google AI Studio](https://aistudio.google.com/app/apikey). The app uses Gemini for suggestions. If `EXPO_PUBLIC_API_URL` is set, the app uses the API first, then Google AI, then OpenAI.

3. **Option C — OpenAI (optional fallback)**  
   Set `EXPO_PUBLIC_OPENAI_API_KEY=sk-...` if you prefer OpenAI; used only when Google AI key is not set.

If none are set, the app uses **rule-based** suggestions (no API key required).  
After adding or changing `.env`, restart the dev server (`npx expo start`).

### Magic (email OTP + Solana wallet)

To use **Magic Connect** (passwordless email OTP and a Solana embedded wallet):

1. Get a **publishable** API key from [Magic Dashboard](https://dashboard.magic.link).
2. In `apps/mobile/.env` set:
   ```bash
   EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_...
   ```
3. Restart the dev server. The sign-in screen will show **“Send magic code”** first; users enter email and receive a one-time code. After login, Magic creates a Solana wallet for them (shown in Profile; used for premium/$PULSE).
4. You can still use **“Or sign in with email & password”** for API or mock auth.

## Quick start

**From repo root (PulseFlowApp):**
```bash
cd apps/mobile
npm install
npx expo start
```

**If you're already in `apps/mobile`:**
```bash
npm install
npx expo start
```

- **Expo Go:** Scan QR with Expo Go (App Store / Play Store).
- **iOS Simulator:** Press `i` (Mac + Xcode).
- **Android:** Press `a` (Android Studio emulator).

## Testing

See [Frontend & Testing](../../docs/frontend-and-testing.md) for:

- How to test on simulators and devices
- Wallet connector compatibility (Phantom, WalletConnect, Solana)
- Development build for Phantom SDK

## Wallet connectors

$PULSE lives on [Pump.fun](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump). The app will:

- Connect Solana wallets (Phantom recommended)
- Read balance / staking (read-only; no in-app trading)
- Gate Premium by staking

Use a **development build** for Phantom’s React Native SDK; Expo Go does not support it.

## Blocks

- **Body Signals** — Native: Overview, Trends, Log Data.
- **Work Routine** — Native: Overview (streak, total, weekly %), Check-in (6 questions), Insights (assessment + quick wins). Other blocks (Nutrition, Movement, Recovery) are Coming Soon.

## Spec

Full spec: [.specify/specs/001-pulse-platform/](../../.specify/specs/001-pulse-platform/).
