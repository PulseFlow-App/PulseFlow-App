# Rewards vault (optional)

Optional **vault contract** for paying out $PULSE (or a wrapped/bridged token) when users redeem points. Points themselves stay in the API database; this contract only **holds tokens** so you can pay out from a dedicated treasury.

## Flow

1. You (owner) **deposit** $PULSE (or wrapped token) into the vault.
2. When a user redeems points in the app, backend records the request and you (or an admin) **send** the agreed amount to the user’s wallet by calling `transferTo(recipient, amount)` on this contract.
3. Backend deducts the user’s points when you mark the redemption fulfilled.

No on-chain “points” or “redemption” logic: the contract is a simple **treasury** you fund and use to send tokens to recipients.

## When to use

- **$PULSE on Solana (Pump.fun):** You can send directly from your wallet to the user’s wallet; no contract needed. Or implement a small Solana program that holds the token and lets the owner transfer (same idea as this vault).
- **EVM (e.g. wrapped/bridged $PULSE on Ethereum):** Use the Solidity vault in this folder: deploy it, approve and deposit the token, then call `transferTo(userAddress, amount)` to fulfill redemptions.

## Files

- `RewardVault.sol`  - Minimal vault: owner deposits ERC20 and can transfer to any address.

## Deploy (EVM)

1. Deploy `RewardVault` with the reward token address (e.g. wrapped $PULSE).
2. As owner, `token.approve(vault, amount)` then `vault.deposit(amount)`.
3. To pay a user: `vault.transferTo(userWallet, amount)`.

See [Points and Redemption](../../docs/points-and-redemption.md) for the full design.
