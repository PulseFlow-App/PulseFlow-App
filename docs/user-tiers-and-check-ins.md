# User Tiers and Check-ins

Sign-in is by **email or Google** (and optionally **wallet**). **Wallet never gates the core app**: all logged-in users see the dashboard, all block inputs, and all recommendations. Wallet only unlocks **on-chain points**, **rewards**, and **Pulse Lab** (when also holding $PULSE).

---

## What is never gated by wallet

- **App access**: Only **login** (email or Google) is required. No wallet required to use the app.
- **Dashboard**: All logged-in users see the full dashboard (block cards, points breakdown, invite).
- **All inputs**: Body Signals (log, check-in), Work Routine (check-in), Nutrition (fridge, meal timing, hydration, reflection) -all available to every logged-in user.
- **Recommendations and insights**: Body Pulse result (pattern, “what’s shaping your Pulse,” “one thing to try”), nutrition results, and other AI insights are shown to everyone. No wallet required.

Users without a wallet see a **“Get the full experience”** card on the dashboard recommending they connect a wallet; they can ignore it and use all inputs and recommendations.

---

## Tiers (what wallet / $PULSE add)

| Tier | Who | Extra (never blocks inputs or insights) |
|------|-----|------------------------------------------|
| **Logged in, no wallet** | Email or Google only | Full dashboard, all blocks, all recommendations. Optional nudge to connect wallet. |
| **Wallet connected** | Same + Solana wallet (e.g. Phantom) | On-chain points (e.g. daily check-in on-chain), redeem for $PULSE, advanced metrics where we add them. |
| **Pulse Lab** | Wallet + holding $PULSE | Access to **Pulse Lab** (`/lab`): experiments, raw dashboards, early access. |

---

## Check-ins

- **In-app check-ins** (body signals, work routine, nutrition): available to **all** signed-in users. No wallet required.
- **On-chain daily check-in**: only for **wallet** users (optional CTA on Work Routine Done). One check-in per cooldown; points on-chain, redeemable for $PULSE.

---

## Implementation notes

- **Tier detection**: `useHasWallet()` (connected wallet from `WalletContext`) and `useHasPulseLabAccess()` (wallet + `holdsPulse` from RPC).
- **Routing**: `DashboardGate` always renders full `Dashboard` for any logged-in user. Wallet is not checked for dashboard or block routes. Only `/lab` is gated (wallet + hold $PULSE).
- **Footer**: “Pulse Lab” when `holdsPulse`, “Unlock Pulse Lab” when wallet only, “Join the ecosystem” when no wallet.
- **Env**: Optional `VITE_SOLANA_RPC`, `VITE_PULSE_MINT` for wallet balance check (Pulse Lab gate).
