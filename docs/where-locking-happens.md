# Where Does Locking Happen?

The Pulse app is **read-only**: it only checks whether a wallet has locked enough $PULSE (for the right duration) and unlocks Premium. It does **not** perform locking inside the app.

**User rule:** Users lock their tokens **for as long as they want to use the paid tier**. Lock for 1 month → Premium for 1 month; lock for 1 year → Premium for 1 year. The lock duration is chosen by the user when they lock.

**Actual locking** happens **outside the app**, on a separate site or platform. The user:

1. Gets $PULSE (e.g. on [Pump.fun](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump)).
2. Goes to **your locking venue** (or a third-party one) and locks $PULSE there for the duration they want Premium (e.g. 1 month, 3 months, 1 year).
3. Returns to the app; the app **reads** chain state (e.g. lock contract or program) and unlocks Premium if the check passes (amount and remaining lock time).

---

## Options for where locking happens

### 1. Your own locking site (recommended for “our platform”)

- You deploy a **locking UI** (e.g. `lock.pulseflow.site` or `app.pulseflow.site/lock`) where users connect wallet and lock $PULSE into a **lock contract** or program you control (or that you integrate with).
- You define the rules (min amount, allowed durations, etc.) and the **same program/contract** is what your app (or API) reads to verify “has this wallet locked enough for long enough?”
- **Pros:** Full control, clear “Lock at Pulse” story, one place to update rules.  
- **Cons:** You need a lock contract (or use a no-code locking provider) and a simple web UI.

### 2. Streamflow or similar (Solana vesting / lock)

- **[Streamflow](https://streamflow.io)** and similar Solana products offer vesting and lock-style mechanics. If $PULSE is supported, you could direct users to lock there and then **read** that program’s state (or their API) to verify eligibility and remaining lock time.
- **Pros:** No need to build/maintain a lock contract yourself.  
- **Cons:** Depends on their support for $PULSE and their product; you must integrate your read-only check with their program/API.

### 3. Pump.fun (current link – buying only)

- The app links to **Pump.fun** for $PULSE. Pump.fun is for **trading/buying** the token, not for locking. Keep Pump.fun as the **“Get $PULSE”** step; add a **separate, dedicated locking step** (your site or a lock provider) for “Lock $PULSE to unlock Premium for X time.”

---

## What the app needs to do (read-only)

- **Backend or client:** Call Solana (or your API that calls Solana) to check:
  - Lock contract/program: “Does this wallet have ≥ X $PULSE locked in program Y with at least Z time remaining?”
  - Or equivalent state that encodes amount and unlock time.
- **No signing in the app:** The app (or your API) only **reads** chain state; users do not sign lock transactions in the Pulse app. They sign on the locking site (your UI, Streamflow, etc.).

---

## Suggested flow for users

1. **Get $PULSE** → Link to Pump.fun (or any DEX where $PULSE trades).
2. **Lock $PULSE** → Link to **your locking page** (e.g. `lock.pulseflow.site`) or to a lock provider. Copy: “Lock $PULSE for as long as you want Premium (e.g. 1 month, 1 year).”
3. **Verify in app** → User connects wallet in Pulse; app (or API) does a read-only check and unlocks Premium for the remaining lock period.

Once you pick the venue, set the **locking URL** in the app (e.g. `VITE_LOCKING_URL` in the web app) so “Go to lock $PULSE” opens that page.
