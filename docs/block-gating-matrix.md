# Block gating: wallet vs PULSE

**Rule:** Inputs are never gated. Only specific **outputs** (insights, features) are gated by wallet or by holding $PULSE.

---

## Summary

| Area | Everyone (logged in) | Wallet connected | Wallet + hold $PULSE |
|------|----------------------|------------------|----------------------|
| **Dashboard** | Full dashboard, block cards, points, invite | Same + “Connect wallet” nudge hidden | Same |
| **Body Signals** | Log, result (pattern, shaping, one thing to try) | + “Another angle” (2nd improvement), no “Get more” CTA | Same as wallet |
| **Work Routine** | Check-in flow, “Check-in saved” | + On-chain daily check-in, points | + Pulse Lab teaser → full Lab access |
| **Nutrition** | All inputs, stability, analysis, trick to try | + Recipe ideas from fridge (AI) | Same as wallet |
| **Pulse Lab** (`/lab`) | - | Gate: “Connect wallet” | Full access |

---

## Per-block detail

### Body Signals

- **Inputs (ungated):** Log, all form fields, submit.
- **Outputs (ungated):** Today’s pattern, What’s shaping your Pulse, A small thing to try.
- **Wallet-only:** “Another angle” (second improvement when available).
- **No wallet:** Short CTA: “Connect your wallet to unlock advanced insights and on-chain points.”

### Work Routine

- **Inputs (ungated):** Check-in form, all steps.
- **Outputs (ungated):** “Check-in saved” copy, next steps.
- **Wallet-only:** “Earn on-chain points” section (daily check-in on-chain, redeem for $PULSE).
- **Wallet but no PULSE:** Pulse Lab teaser card with link to `/lab`.
- **PULSE holder:** Full Pulse Lab access (route `/lab`).

### Nutrition

- **Inputs (ungated):** Fridge log, meal timing, hydration, reflection.
- **Outputs (ungated):** This week stability, analysis & recommendations, trick to try.
- **Wallet-only:** “Recipe ideas from your fridge” (AI from photos).
- **No wallet:** Short CTA: “Connect your wallet to unlock AI recipe ideas from your fridge photos.”

### Pulse Lab

- **Access:** Wallet + hold $PULSE only. Otherwise show “Connect wallet” or “Hold $PULSE to unlock”.

---

## Implementation

- **Hooks:** `useHasWallet()` and `useHasPulseLabAccess()` from `WalletContext`.
- **Pattern:** Render gated sections only when the right tier is true; optionally show a one-line CTA when not (e.g. “Connect wallet to unlock …”).
