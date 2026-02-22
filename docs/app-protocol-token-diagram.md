# App / Protocol / Token Separation

One-page view of how the three layers interact. No token in the app; protocol bridges app and token.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  APP (Store-Safe)                                                            │
│  • Sign in, dashboard, blocks (Body Signals, Work Routine, …)                │
│  • Premium = Subscribe via Apple/Google IAP                                  │
│  • No token balances, no locking, no “buy token to unlock”                   │
│  • Optional: “Learn about Pulse” / Community → opens web                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │  Uses
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PROTOCOL (Backend / Off-App Logic)                                          │
│  • Auth, user data, rate limits, capacity                                    │
│  • Allocates credits / capacity (can favor $PULSE holders off-app)           │
│  • Never tells the app “because token”; app only sees “capacity” / “premium” │
│  • Governance results, model updates, Lab access rules                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │  Reads / Rewards
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  TOKEN ($PULSE)  - Off-App Only                                                │
│  • Governance (votes on blocks, metrics, roadmap)                            │
│  • Protocol credits (off-app)                                                 │
│  • Pulse Lab access (web)                                                    │
│  • Contributor rewards                                                       │
│  • Future migration key                                                      │
│  • All interaction: web, Farcaster, community  - never in App Store flow      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**User flows:**

- **App-only user:** Signs in → uses app → subscribes to Premium via IAP. Never sees token.
- **Token holder:** Holds $PULSE on web/community → gets protocol credits, votes, Lab access. In the app they are just a user (or premium via IAP); app does not show token or locking.
