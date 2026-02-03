# PulseFlowApp Development Guidelines

Last updated: 2026-01-27

## Active Technologies

### Web (PWA)
- **Vite** + **React 19** + **TypeScript** — `apps/web`
- **React Router** — Routes: `/`, `/dashboard`, `/lab`, `/admin`, `/terms`, `/privacy`, `/disclaimer`
- **vite-plugin-pwa** — Manifest, service worker, install prompt
- **CSS Modules** — Component-level styles

### Backend
- **Node.js** with **Express** — `apps/api`
- **PostgreSQL** (optional) — When `DATABASE_URL` is set; otherwise in-memory
- **JWT** — Auth; **ADMIN_API_KEY** — Admin cabinet (`GET /admin/users`)

### AI
- **OpenAI API** (optional) — Body Signals insights when `VITE_API_URL` points to API with `POST /insights/body-signals`
- **Rule-based fallback** — When API or key is unset, web app uses local rules

### Token / Locking
- **$PULSE** on Solana (Pump.fun). Users **lock** tokens for as long as they want the paid tier (see `/lab`, `docs/where-locking-happens.md`).

## Project Structure

```text
apps/
├── web/                 # PWA (Vite + React)
│   ├── public/
│   └── src/             # pages, components, contexts, blocks/registry
├── api/                 # Backend (Express)
│   └── src/             # index.js, db.js
└── ai-engine/           # Prompts
    └── prompts/

contracts/               # Locking logic (token on Pump.fun)
docs/                    # Vision, product, deploy, env vars, etc.
```

## Commands

### Web (PWA)
- `cd apps/web && npm install && npm run dev` — Dev server at http://localhost:5173
- `npm run build` — Production build to `dist/`

### API
- `cd apps/api && npm install && npm run dev` — Dev server (default port 3000)

### Database
- Set `DATABASE_URL` for persistent users and body logs; otherwise in-memory.

## Code Style

- **TypeScript** (web): Strict mode, interfaces for object shapes.
- **React**: Functional components, hooks, CSS Modules.
- **Node/Express**: async/await, env vars for config.

## Recent Changes

- **Web-first:** PWA in `apps/web`; Expo mobile app removed.
- **Lab** at `/lab`: $PULSE, where to buy, how to lock (lock for as long as you want the paid tier).
- **Admin cabinet** at `/admin`: list users (requires `VITE_API_URL` and `ADMIN_API_KEY`).
- **Locking** (not staking): terminology and docs updated; see `docs/where-locking-happens.md`.
