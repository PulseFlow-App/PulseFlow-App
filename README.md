# Pulse Flow

**The pulse of your rental operations.** Mobile-first PWA for villa ops - owners and on-site staff sharing one live dataset.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth, Postgres + RLS, Realtime, Storage)
- Stripe Billing (company orgs after trial)
- Zod + React Hook Form, Lucide, Recharts
- Installable PWA (`manifest.webmanifest` + `sw.js`)

## Quick start (demo mode)

Demo mode is on by default so you can use the full UI without a Supabase project.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Sign in (seeded demo):**

| Role     | Email                      | Password       |
|----------|----------------------------|----------------|
| Owner    | `owner@pulseflow.site`     | `TestPass123!` |
| Manager  | `manager@pulseflow.site`   | `TestPass123!` |
| Employee | `employee@pulseflow.site`  | `TestPass123!` |

**Or register** at `/register`: pick Personal vs Company, then Owner vs Employee/manager.

**Invites:** Settings → Invite teammate (`/join/[token]`).

## Connect Supabase (production path)

1. Create a Supabase project.
2. Apply **all** SQL migrations in order under [`supabase/migrations/`](supabase/migrations/):
   - `001_schema.sql` … `008_villa_photo.sql`
   - `009_production_rls_storage.sql` (personal-org RLS + villa photos bucket)
   - `010_billing.sql` (trial + Stripe fields)
3. Copy [`.env.example`](.env.example) → `.env.local` and set:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Seed users + sample data:

```bash
npm run seed
```

5. Sign in as `owner@pulseflow.site` / `TestPass123!` and open `/home`.

## Stripe (company subscriptions)

Personal orgs are always free. Company orgs get a **30-day trial**; after that only the **owner** pays.

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID_COMPANY_MONTHLY=price_...
```

Webhook endpoint: `POST /api/billing/webhook`  
Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

Owner billing UI: Settings → Billing.

## App map

- **Home** - greeting, villa tiles, urgent tasks, chart / staff jobs
- **Villas / Tasks / Contacts / Bills / Jobs** - role-gated ops
- **Messages** - org chat (realtime on Supabase)
- **Settings** - profile, invites, assignments, billing (company owners)

## Deploy

See [`docs/PRODUCTION.md`](docs/PRODUCTION.md) for staging QA and launch checklist.

Deploy the app to Vercel (`app.pulseflow.site`), set env vars, point Stripe webhooks at production.
