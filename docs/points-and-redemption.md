# Points and $PULSE Redemption

Points are earned in the app (check-ins, streak, referrals, admin bonus). They are stored in the **API database** and displayed in the app. Later, you can make points **redeemable for $PULSE** that you send from your own funds.

---

## How points are issued (current)

- **Activity points:** From day streak (10 pts/day) and from **check-ins + body logs** (30 pts each).  
  The API now uses **server-side counts**: when the app calls `GET /users/me/points?streak=...`, the API reads **work routine check-ins** and **body logs** from the database and recomputes activity points. So points count as long as:
  - `DATABASE_URL` is set and tables exist (see [setup-database.md](./setup-database.md)).
  - Work routine check-ins are saved via `POST /users/me/check-ins` (the app does this when the user submits a check-in and when the dashboard syncs).
  - Body logs are saved via `POST /users/me/body-logs` if the app syncs them (currently the app may store body logs only locally; syncing them would increase the body-log count and thus activity points).
- **Referral points:** When a referral is completed (see referrals flow).
- **Bonus points:** Admin grants via `POST /admin/points`.

So **points are fully backend-driven**; no smart contract is required for issuance.

---

## Redemption: options

You said you want points to be **redeemable for $PULSE**, which you will **manually send from your own funds**. Two simple options:

### Option A: Manual send (no contract)

1. In the app, user connects or enters a **wallet address** (e.g. in Profile) and can request **“Redeem X points for $PULSE”**.
2. Backend records the redemption request (user id, amount, wallet, status: pending).
3. You (owner) see pending redemptions (e.g. in Admin or a small dashboard), then **send $PULSE** from your wallet to the user’s wallet (Pump.fun / Solana).
4. You mark the redemption as fulfilled in the backend; backend deducts points from the user.

No smart contract: you just hold $PULSE in your wallet and send it when you fulfill.

### Option B: Reward vault contract (optional)

If you prefer to **pre-fund a vault** and pay out from there (e.g. for accounting or to separate “reward treasury” from your main wallet):

1. Deploy a **vault** that holds **$PULSE** and has an **owner** (you) who can **deposit** and **transferTo(recipient, amount)**.
2. You deposit $PULSE into the vault. When a user redeems, you (or an admin tool) call the vault to transfer the agreed amount to the user’s wallet. Points are still deducted in the **backend** when you mark the redemption fulfilled.

The contract is only a **treasury**: it doesn’t need to know about “points” or “app users”; the backend stays the source of truth.

- **$PULSE on Solana (Pump.fun):** Use the **Solana** Reward Vault in `contracts/rewards-solana/`. It’s an Anchor program: owner can `deposit` (transfer tokens into the vault) and `transfer_to` (send from vault to a recipient’s token account). See `contracts/rewards-solana/README.md` for build and deploy.
- **EVM (wrapped/bridged $PULSE):** Use the Solidity vault in `contracts/rewards/` (`RewardVault.sol`).

---

## Summary

| What              | Where it lives | Contract needed? |
|-------------------|----------------|------------------|
| **Issuing points**| API + DB       | No               |
| **Storing points**| API + DB       | No               |
| **Redeeming**     | You send $PULSE to user’s wallet | No (manual) or optional vault (Solana or EVM) |

So you can **keep the current “points in DB” design** and add redemption as: **backend records redemption request → you send $PULSE manually (or from a vault contract)**. If you want a vault, see `contracts/rewards/` for a minimal EVM example you can adapt or mirror on Solana.
