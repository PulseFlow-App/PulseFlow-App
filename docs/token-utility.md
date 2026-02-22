# Pulse Token Utility (Policy-Safe)

**Rule of the game:** Premium access is app-native (IAP). $PULSE affects everything *around* the app, not inside it. Apple & Google never see the token.

---

## Mental Model

| Layer | Role |
|-------|------|
| **App** | Compliant, store-safe. Premium = subscription via IAP. No crypto in UI. |
| **Protocol** | Off-app logic, intelligence, incentives. Consumes/allocates credits; cares about $PULSE. |
| **Token** | Governance, reputation, allocation, priority. Used on web / Farcaster / community, not in-app. |

The app consumes the protocol. The protocol cares about $PULSE. Apple never sees the token.

---

## What Stores Allow vs Disallow

**Allowed:**

- Crypto existing, wallet connections (when limited), viewing balances, education, analytics, read-only data, external benefits.

**Not allowed:**

- Crypto as required payment for in-app features.
- Token-gated access that bypasses IAP.
- “Buy token → unlock feature” flows inside the app.

**So:** Premium = IAP only in the app. $PULSE utility lives off-app (protocol credits, governance, Lab, rewards, migration).

---

## What Premium Is (App / Store)

**Inside the app:**

- **Premium** = Unlimited daily requests, long-term trend tracking, advanced correlations, baseline modeling, weekly adaptive plans.
- **Payment** = Apple / Google IAP. No crypto mention.

**Behind the scenes:**

- Protocol decides capacity and cost.
- Token holders can be cheaper to serve (protocol credits) and can influence direction (governance). The app never says *why* you have more capacity; it just sees credits/capacity from the backend.

---

## 6 Policy-Safe Uses of $PULSE (Off-App)

### 1. Protocol-level credits

- App sells **Premium** via IAP (store-approved).
- Separately, $PULSE holders receive **protocol credits** (off-app).
- Credits are consumed by advanced AI runs, long-term modeling, high-cost inference. The app never explains *why* capacity is higher; it just sees credits from the backend.

### 2. Reputation & signal weight

- $PULSE can influence how much the system trusts a user (e.g. higher-weight feedback, priority in model tuning, data influencing recommendations more).
- In-app we only show things like “Your profile has high signal confidence.” No mention of token.

### 3. Governance & direction

- Token holders vote on: which blocks ship next, what metrics to prioritize, what data sources to support; they propose features and allocate research focus.
- All governance happens on **web**, **Farcaster**, **community channels**  - never inside the App Store flow.

### 4. Access to “Pulse Lab” (web-only)

- **Pulse Lab** = web-only, experimental: raw dashboards, prompt templates, model experiments, architecture discussions, live dev sessions.
- $PULSE = access to how the intelligence is built. Attractive to builders and power users. No token mention in the main app.

### 5. Token rewards for contribution

- Reward actions that improve the system: anonymized insights, playbooks, edge-case reports, datasets (recipes, routines, workouts).
- Avoids pay-to-win / speculative utility; creates contributor economy and skin in the game. All off-app.

### 6. Future migration key

- If regulations change or a web-only / decentralized client ships, $PULSE can act as migration key, identity anchor, history passport. Long-term optionality; no need to announce in-app.

---

## Public Messaging (Use Everywhere)

- **“Pulse is an app you can use every day. $PULSE is how the system evolves.”**
- **“You don’t need crypto to use Pulse. Crypto is for those who want to help shape it.”**

---

## What NOT to Do (App Store / Play)

- Do **not** show token balances in the app.
- Do **not** mention locking in the UI.
- Do **not** hint that token replaces subscription.
- Do **not** ask Apple/Play users to “go buy token” to unlock features.

That’s instant rejection.

---

## Summary

- **Users** use the app.
- **Premium users** pay via the app store (IAP).
- **Token holders** influence intelligence, direction, and depth (off-app).
- **Protocol** quietly bridges both worlds.

This is clean, scalable, and regulation-resilient.

---

See also: [App / Protocol / Token diagram](./app-protocol-token-diagram.md) | [App Store–safe copy](./app-store-copy.md) | [Contracts](../contracts/README.md)
