# Pulse

Pulse is a **data-first wellness platform** that turns everyday lifestyle inputs into clear, practical guidance.

Most health apps overwhelm people with numbers, charts, and disconnected tools. Pulse does the opposite. It connects food, movement, recovery, and body metrics into a **single daily signal** that helps people make better decisions without constant tracking or analysis.

At the core of Pulse is the **Daily Pulse score** — a simple number from 0 to 100 that reflects how the user's body is responding on a given day. As users log meals, movement, sleep, mood, or body data, the score adapts in real time. Over time, Pulse learns **personal baselines** instead of relying on generic averages.

---

## What Pulse Does

Pulse helps users make sense of daily inputs:

- **Fridge → Meals** — Upload photos of fridge contents to receive meal suggestions based on available ingredients and personal goals
- **Movement → Performance** — Turn workouts and activity into performance and recovery signals rather than raw metrics
- **Body → Feedback** — Track weight, sleep, mood, and optional smart scale data without obsessing over daily fluctuations
- **Labs & patterns** — Upload test results (e.g. blood panels, body composition) to explore patterns and trends *(non-medical, educational insights only)*

---

## Premium Access

Premium features are unlocked by **holding and staking Pulse tokens ($PULSE)**. The token exists on [Pump.fun](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump) — no token contract to create.

**Premium includes:**

- Unlimited AI requests per day
- No per-request fees (excluding network gas)
- Long-term trend tracking
- Personal baseline modeling
- Daily vs historical comparisons
- Advanced, context-aware recommendations
- Multi-input reasoning across food, movement, and body data
- Weekly adaptive meal suggestions
- Personal nutrition pattern analysis
- Fitness progress interpretation
- Unlimited smart scale insights

---

## Data Ownership & Privacy

Pulse is built with **privacy and user ownership** as core principles:

- User data is **encrypted** and **exportable**
- No data is **sold** or **shared**
- Users **control** what they connect, upload, or remove

---

## Vision

Pulse is not a medical product and not a fitness gadget.

It is an **everyday system** for understanding your own rhythm, reducing noise, and making better decisions consistently — powered by your data, shaped by your habits, and adapted to you over time.

> **Pulse is a signal.**

---

## Documentation

| Document | Description |
|----------|-------------|
| [**Vision**](docs/vision.md) | Why Pulse exists, philosophy, and core belief |
| [**Product**](docs/product.md) | What Pulse does, features, and user tiers |
| [**Roadmap**](docs/roadmap.md) | MVP 1 (core signal) and MVP 2 (adaptation & baselines) |
| [**Token Utility**](docs/token-utility.md) | How $PULSE staking unlocks Premium |
| [**AI Stack**](docs/ai-stack.md) | Recommended AI architecture: inputs, reasoning, Pulse score, baselines |
| [**FAQ**](docs/faq.md) | Common questions on product, Premium, privacy, and technical |
| [**Frontend & testing**](docs/frontend-and-testing.md) | Do we have a frontend? How to test the mobile app. Wallet connector compatibility. |
| [**Move repo to org**](docs/move-repo-to-org.md) | Steps to transfer this repo and the Pulse landing page to the PulseFlow-App organization. |

**Other references:**

- [Data model & privacy](data-model/privacy.md) — Data ownership and consent rules
- [Contracts](contracts/README.md) — Staking logic (token lives on Pump.fun; no contract to deploy)
- [**Frontend & testing**](docs/frontend-and-testing.md) — Do we have a frontend? How to test the mobile app. Wallet connector compatibility (Solana / Phantom).

---

## Frontend & testing

- **Do we have a frontend?** No full UI yet. There is a **runnable Expo mobile scaffold** in `apps/mobile/` you can open in the simulator or on a device.
- **How to test the mobile app:** `cd apps/mobile && npm install && npx expo start` — then use Expo Go (scan QR) or press `i` / `a` for iOS / Android simulator.
- **Wallet compatible?** Yes. The mobile app is designed to work with **Solana** wallets (e.g. **Phantom**) for $PULSE (Pump.fun). Use a **development build** for Phantom’s React Native SDK; see [Frontend & testing](docs/frontend-and-testing.md).

---

## Project Structure

```
pulse/
├── apps/
│   ├── mobile/                 # Pulse mobile app (Expo / React Native) — runnable scaffold
│   │   ├── App.tsx
│   │   ├── app.json
│   │   ├── assets/
│   │   └── README.md
│   ├── web/                    # Web app (pulseflow.site) — placeholder
│   │   ├── public/
│   │   │   └── assets/         # Icons, images, fonts
│   │   ├── src/
│   │   │   ├── app/            # App shell, routing, layout
│   │   │   ├── pages/          # Landing, dashboard, profile
│   │   │   ├── components/     # UI components (cards, charts, inputs)
│   │   │   ├── features/       # Feature modules (meals, fitness, sleep)
│   │   │   ├── hooks/          # Custom hooks (data sync, auth, AI calls)
│   │   │   ├── styles/         # Design system & theme
│   │   │   ├── utils/          # Helpers, validators
│   │   │   └── main.tsx
│   │   └── index.html
│   │
│   ├── api/                     # Backend / edge API
│   │   └── src/
│   │       ├── routes/        # REST / RPC endpoints
│   │       ├── services/      # Business logic
│   │       ├── ai/            # Prompt logic, reasoning pipelines
│   │       ├── auth/          # Wallet / session auth
│   │       ├── db/            # Database access layer
│   │       ├── middleware/
│   │       └── index.ts
│   │
│   └── ai-engine/             # Core intelligence (separable)
│       ├── prompts/           # Prompt templates
│       ├── reasoning/         # Multi-input reasoning logic
│       ├── baselines/         # Personal baseline modeling
│       ├── trend-analysis/    # Daily vs historical comparisons
│       ├── recommendations/   # Meals, fitness, recovery, focus
│       └── index.ts
│
├── packages/
│   ├── ui/                    # Shared UI components
│   ├── types/                 # Shared TypeScript types
│   ├── config/                # App-wide configs
│   └── utils/                 # Shared utilities
│
├── contracts/                 # Staking logic (token on Pump.fun; no token contract)
│   ├── staking/
│   └── README.md
│
├── data-model/
│   ├── schemas/               # User data schemas (food, body, habits)
│   ├── normalization/         # Data cleaning & structuring
│   └── privacy.md             # Data ownership & consent rules
│
├── docs/
│   ├── vision.md
│   ├── product.md
│   ├── token-utility.md
│   ├── roadmap.md
│   ├── ai-stack.md
│   └── faq.md
│
├── scripts/                   # Dev & ops scripts
├── .env.example
└── package.json
```

### Why this structure works

- **AI is not glued to the UI** — The reasoning engine can evolve independently.
- **Features are modular** — Meals, fitness, blood data, fridge photos can grow without chaos.
- **User data is first-class** — Clear schemas, normalization, and a privacy layer.
- **Token logic is isolated** — No pollution of core product logic.
- **Future-proof** — Mobile app, browser extension, wearable sync can plug in later.

---

## Feature-Level Example: Meals

```
features/meals/
├── ui/
├── logic/
│   ├── ingredient-detection.ts
│   ├── recipe-matching.ts
│   └── nutrition-patterns.ts
├── prompts/
└── types.ts
```

---

## Spec-Driven Development (SDD)

This repo uses **Spec Kit** for spec-driven development. Specifications, plans, and tasks live under:

- [`.specify/specs/001-pulse-platform/`](.specify/specs/001-pulse-platform/) — Spec, plan, data model, contracts, tasks

---

## Create GitHub repo

From the project root:

```bash
git init
git add .
git commit -m "chore: initial Pulse structure, docs, and SDD specs"
gh auth login   # if not already
gh repo create pulse --source=. --public --push
```

Or to use an existing GitHub repo:

```bash
git init
git remote add origin https://github.com/PulseFlow-App/PulseFlow-App.git
git add .
git commit -m "chore: initial Pulse structure, docs, and SDD specs"
git branch -M main
git push -u origin main
```

---

## License

Proprietary. All rights reserved.
