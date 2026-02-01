# Where Does Staking Happen?

The Pulse app is **read-only**: it only checks whether a wallet has staked enough $PULSE (or holds enough) and unlocks Premium. It does **not** perform staking inside the app.

**Actual staking** happens **outside the app**, on a separate site or platform. The user:

1. Gets $PULSE (e.g. on [Pump.fun](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump)).
2. Goes to **your staking venue** (or a third-party one) and stakes/locks $PULSE there.
3. Returns to the app; the app **reads** chain state (e.g. staking program, lock contract, or balance) and unlocks Premium if the check passes.

---

## Options for where staking happens

### 1. Your own staking site (recommended for “our platform”)

- You deploy a **staking UI** (e.g. `stake.pulseflow.site` or `app.pulseflow.site/stake`) where users connect wallet and stake $PULSE into a **staking program** or **lock contract** you control (or that you integrate with).
- You define the rules (min amount, lock period, etc.) and the **same program/contract** is what your app (or API) reads to verify “has this wallet staked enough?”
- **Pros:** Full control, clear “Stake at Pulse” story, one place to update rules.  
- **Cons:** You need a staking contract (or use a no-code staking provider) and a simple web UI.

### 2. Streamflow or similar (Solana staking / liquidity)

- **[Streamflow](https://streamflow.io)** offers vesting, liquidity, and staking-style products on Solana. If $PULSE is in a pool or program they support, you could direct users to stake there and then **read** that program’s state (or Streamflow’s API) to verify eligibility.
- Other Solana options: **Marinade**, **Jito** (staking), or any **DEX/staking UI** that supports your token and exposes on-chain state you can query.
- **Pros:** No need to build/maintain a staking contract yourself.  
- **Cons:** Depends on their support for $PULSE and their product (e.g. liquidity lock vs “staking”); you must integrate your read-only check with their program/API.

### 3. Pump.fun (current link – buying only)

- Right now the app links to **Pump.fun** for $PULSE. Pump.fun is for **trading/buying** the token, not for staking in the usual sense (no “stake to earn” or “lock to get premium” flow there).
- So: keep Pump.fun as the **“Get $PULSE”** step; add a **separate, dedicated staking step** (your site or Streamflow, etc.) for “Stake $PULSE to unlock Premium.”

---

## What the app needs to do (read-only)

- **Backend or client:** Call Solana (or your API that calls Solana) to check one of:
  - Staking program: “Does this wallet have ≥ X $PULSE staked in program Y?”
  - Lock contract: “Is this wallet’s position in contract Z ≥ X?”
  - Or simple balance: “Does this wallet hold ≥ X $PULSE?” (less “staking” but still token-gating.)
- **No signing in the app:** The app (or your API) only **reads** chain state; users do not sign staking transactions in the Pulse app. They sign on the staking site (Streamflow, your UI, etc.).

---

## Suggested flow for users

1. **Get $PULSE** → Link to Pump.fun (or any DEX where $PULSE trades).
2. **Stake $PULSE** → Link to **your staking page** (e.g. `stake.pulseflow.site`) or to **Streamflow** (if they support $PULSE and you integrate the read with their program). Copy in the app: “Stake at [Stake Pulse / Streamflow / …].”
3. **Verify in app** → User connects wallet in Pulse; app (or API) does a read-only check and unlocks Premium if the stake (or balance) meets the bar.

Once you pick the venue (your own site vs Streamflow vs other), set the **staking URL** in the app (e.g. `STAKING_LINK` in PremiumContext / StakePremiumScreen) so “Go to staking” opens that page instead of only Pump.fun.
