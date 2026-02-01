# Pulse Contracts

This directory holds **staking and integration logic** for the Pulse token. The **$PULSE token already exists** on [Pump.fun](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump) — we do **not** create or deploy a token contract.

## Contents

- `staking/` — Staking logic for Premium access (read-only chain interaction with existing $PULSE)

## Token Utility

Premium features are unlocked by **staking Pulse tokens**. The app:

- Verifies wallet ownership
- Uses **read-only** chain interaction
- Does **not** support in-app token trading (for store compliance)

See [Token Utility](../docs/token-utility.md) for product-level details.

---

📖 See also: [Token Utility](../docs/token-utility.md) | [Roadmap](../docs/roadmap.md)
