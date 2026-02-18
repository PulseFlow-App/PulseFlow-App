# User Tiers and Check-ins

Two sign-in flows with different privileges: **Google (Simple Pulse)** vs **Wallet (full experience)**. Holding the token unlocks **Pulse Lab** and advanced features.

---

## Tiers

| Tier | Who | Experience |
|------|-----|------------|
| **Simple Pulse** | Signed in with **Google only** (no wallet) | Minimal: daily Pulse and check-in. **No** full dashboard, **no** leaderboard. |
| **Privileged** | **Wallet connected** (e.g. Phantom) | Full dashboard, leaderboard, on-chain points and daily check-in, redeem for $PULSE. |
| **Pulse Lab** | **Wallet + holding $PULSE** | Everything above + access to **Pulse Lab** (web) and advanced features. |

---

## Flows

### 1. Google sign-in only → Simple Pulse

- User signs in with Google.
- They get a **simple** view: today’s Pulse, one primary check-in path (e.g. “How are you?” → quick insight). No dashboard grid, no block cards, no leaderboard.
- Messaging: “Connect your wallet to unlock the full dashboard, leaderboard, and rewards.”

### 2. Wallet connected → Full dashboard and leaderboard

- User connects a Solana wallet (e.g. Phantom) in addition to (or instead of) Google.
- Unlocks: full **dashboard** (Body Signals, Work Routine, Nutrition, etc.), **leaderboard**, on-chain **points** (e.g. daily check-in on-chain), and ability to **redeem** points for $PULSE.
- Check-ins: same in-app check-ins, plus optional **on-chain daily check-in** for points.

### 3. Wallet + holding $PULSE → Pulse Lab and advanced

- User has a connected wallet **and** holds $PULSE (above a configurable threshold, e.g. > 0).
- Unlocks: **Pulse Lab** (web: experiments, raw dashboards, prompt templates) and any **advanced** features (e.g. priority insights, extra blocks).
- Lab route `/lab` is only accessible when this tier is active; otherwise show “Hold $PULSE to unlock Pulse Lab.”

---

## Check-ins

- **In-app check-ins** (body signals, work routine, nutrition): available to all signed-in users. Google-only users see them in the **Simple** flow (single focus). Wallet users see them in the full dashboard.
- **On-chain daily check-in**: only for **wallet** users. They call the Solana program once per cooldown to earn on-chain points; no API required.

---

## Implementation notes

- **Tier detection**: `hasWallet` (connected wallet pubkey from `WalletContext`) and `holdsPulse` (token balance > 0 from RPC; `VITE_PULSE_MINT` + `VITE_SOLANA_RPC`). Google-only = no wallet.
- **Routing**: `/dashboard` shows `SimpleDashboard` when no wallet, full `Dashboard` when wallet connected (`DashboardGate`). `/lab` shows content only when wallet + token; else shows “Connect wallet” or “Hold $PULSE to unlock”.
- **Nav**: Simple Pulse = no block grid, no leaderboard (leaderboard can be added later for wallet tier). Footer: “Pulse Lab” link when `holdsPulse`, “Unlock Pulse Lab” when wallet only, “Join the ecosystem” when no wallet.
- **Env**: Optional `VITE_SOLANA_RPC`, `VITE_PULSE_MINT` for wallet balance check (Pulse Lab gate).
