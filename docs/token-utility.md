# Pulse Token Utility

## Token

**$PULSE** exists on [Pump.fun](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump). We do **not** need to create a token contract — integration is read-only (balance / staking checks).

## Overview

Premium features are unlocked by **holding and staking Pulse tokens ($PULSE)**.

Token logic:

- Verify wallet ownership
- Read-only chain interaction from app
- No in-app token trading (store compliant)

## MVP 1 — Token-Gated Premium

- **Premium Tier** unlocked by staking
- Higher daily request limits
- No per-request fees (excluding network gas)
- Access to Pulse Score explanations

## MVP 2 — Full Premium

Staking unlocks:

- **Unlimited AI requests** per day
- **No per-request fees** (excluding gas)
- **Long-term trend tracking**
- **Personal baseline modeling**
- **Daily vs historical comparisons**
- **Advanced, context-aware recommendations**
- **Multi-input reasoning** across food, movement, and body data
- **Weekly adaptive meal suggestions**
- **Personal nutrition pattern analysis**
- **Fitness progress interpretation**
- **Unlimited smart scale insights**
- **Priority model updates** and new insight modules

## Technical Implementation

- On-chain check (read-only) for balance / staking status
- Request limits enforced at gateway level
- Off-chain cache (e.g. Redis) for performance
- Rate limiter (IP + wallet)

---

📖 See also: [Product](./product.md) | [Roadmap](./roadmap.md) | [Contracts](../contracts/README.md) | [PULSE on Pump.fun](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump)
