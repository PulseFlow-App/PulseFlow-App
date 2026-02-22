# Points and $PULSE Redemption

Points are earned in the app (check-ins, streak, referrals, admin bonus). They can live in the **API database** and/or **on-chain** (Solana). On-chain points are **redeemable for $PULSE** directly from the Reward Vault program.

---

## How points are issued (current)

- **Activity points:** From day streak (10 pts/day) and from **check-ins + body logs** (30 pts each).  
  The API now uses **server-side counts**: when the app calls `GET /users/me/points?streak=...`, the API reads **work routine check-ins** and **body logs** from the database and recomputes activity points. So points count as long as:
  - `DATABASE_URL` is set and tables exist (see [setup-database.md](./setup-database.md)).
  - Work routine check-ins are saved via `POST /users/me/check-ins` (the app does this when the user submits a check-in and when the dashboard syncs).
  - Body logs are saved via `POST /users/me/body-logs` if the app syncs them (currently the app may store body logs only locally; syncing them would increase the body-log count and thus activity points).
- **Referral points:** When a referral is completed (see referrals flow).
- **Bonus points:** Admin grants via `POST /admin/points`.

So **points are fully backend-driven** for issuance; you can keep the API as source of truth and **sync** balances on-chain when users want to redeem.

---

## Why might the API show 0 points?

Common reasons `GET /users/me/points` returns zeros:

- **No database:** `DATABASE_URL` is unset or wrong; the API falls back to zeros.
- **User not in DB:** The JWT’s user id doesn’t match a row in `users`, or the user was never created (e.g. auth/sync didn’t run).
- **Activity not synced:** Activity points come from **check-ins** and **body logs** in the DB. If the app doesn’t call `POST /users/me/check-ins` or `POST /users/me/body-logs`, or `streak`/`checkIns` aren’t sent with the points request, activity (and total) can be 0.
- **Tables/columns missing:** `users` needs `activity_points`, `referral_points`, `bonus_points` (see [setup-database.md](./setup-database.md)).

**Alternative: earn on-chain (no API).** Use the Solana Reward Vault’s **daily check-in**: users connect their **wallet** and call `daily_check_in` once per cooldown (e.g. 24h). Points are stored on-chain in a PDA; you can show balance by reading that account from the chain. See `contracts/rewards-solana/README.md`  - section “Earning points without the API”.

---

## Redemption: options

### Option A: On-chain points (recommended)

The **Solana Reward Vault** (`contracts/rewards-solana/`) supports **on-chain points** that users redeem for tokens:

1. Owner sets a **redemption rate** (e.g. 100 points = 1 $PULSE) via `set_redemption_rate`.
2. Owner **deposits** $PULSE into the vault and **credits** points to users' on-chain PDAs via `credit_points(user, amount)`. You can credit from your backend when users earn points (e.g. after check-ins or referrals).
3. **User** calls `redeem(points_amount)`; the program deducts points and sends $PULSE to their token account. No manual send or backend call needed for the actual payout.

See `contracts/rewards-solana/README.md` for instructions: `initialize`, `set_redemption_rate`, `deposit`, `credit_points`, `redeem`.

### Option B: Manual send (no on-chain points)

1. User connects or enters a **wallet address** and requests redeem X points for $PULSE.
2. Backend records the request and you (owner) **send $PULSE** from your wallet or from the vault via `transfer_to`.
3. Backend deducts points from the user in the DB.

### Option C: EVM vault

For wrapped/bridged $PULSE on EVM, use `contracts/rewards/` (`RewardVault.sol`). That vault is treasury-only (no on-chain points).

---

## Summary

| What              | Where it lives | Notes |
|-------------------|----------------|--------|
| **Issuing points**| API + DB       | Check-ins, streak, referrals, admin bonus |
| **Storing points**| API + DB and/or on-chain (Solana) | Sync to chain when you credit for redemption |
| **Redeeming**     | User calls `redeem` on Solana, or manual send | On-chain: trustless; manual: you send $PULSE and deduct in API |

Using **on-chain points** in the Solana vault gives users a single, trustless redemption flow: they sign `redeem` and receive $PULSE to their wallet at the configured rate.
