# Solana / rewards integration

Frontend wiring for the reward_vault program (on-chain points, daily check-in, redeem).

## Env

- `VITE_SOLANA_RPC` — RPC endpoint (default devnet).
- `VITE_PULSE_MINT` — $PULSE token mint (for vault PDA and PULSE balance).
- `VITE_REWARD_PROGRAM_ID` — Deployed reward_vault program ID (for daily_check_in and redeem).

## Modules

- **config** — `getSolanaConfig()`, env constants.
- **dailyCheckIn** — `buildDailyCheckInInstruction`, `buildDailyCheckInTransaction`, `submitDailyCheckIn()` (Phantom sign + send).
- **points** — `fetchOnChainPointsBalance(wallet)` to read PointsAccount balance.

## Hooks

- `useOnChainDailyCheckIn()` — `trigger()`, `status`, `error`, `canCheckIn`.
- `useOnChainPoints()` — `balance`, `loading`, `refresh` (for redeem UI).

## Adding redeem

1. In the program, `redeem(points_amount)` takes: user (signer), vault, mint, points_account, vault_token_account, user_token_account, token_program.
2. Add `buildRedeemInstruction(userPubkey, pointsAmount)` and `submitRedeem(pointsAmount)` here (same pattern as dailyCheckIn: build ix, build tx, wallet.signTransaction or signAndSendTransaction).
3. Use `useOnChainPoints().balance` and a form to choose amount, then call `submitRedeem(amount)`.

## Wallet

Phantom (or other injected `window.solana`) is used for `signTransaction` / `signAndSendTransaction`. No Anchor dependency in the frontend; instructions are built manually with the correct discriminators and account keys.
