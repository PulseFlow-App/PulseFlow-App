# Production launch checklist

## Phase 0 — Foundations

- [x] Supabase project created (staging + production)
- [x] Env vars set in Vercel / `.env.local` from `.env.example`
- [x] Migrations `001` → `010` applied in order on each project
- [x] `npm run seed` succeeds on staging
- [x] Seeded owner can open `/home` with `NEXT_PUBLIC_DEMO_MODE=false`

## Phase 1 — Auth

- [x] Register personal owner end-to-end
- [x] Register company owner (trial fields set, `subscription_status=trialing`)
- [x] Create invite from Settings; accept on `/join/[token]`
- [x] Email confirm / magic link via `/auth/callback` if confirmation enabled
- [x] Middleware refreshes session cookies on App Router navigations

## Phase 2 — Parity

- [ ] Service orders: book → agree → complete
- [x] Personal villas via `personal_org_id` / ensure-personal API
- [x] Villa photo upload to Storage bucket `villas` (not data URLs)
- [x] Receipts upload to `receipts`
- [x] Notifications + endorsements load and update
- [x] Realtime updates for messages / orders / notifications

## Phase 3 — Billing

- [ ] Stripe test product + monthly Company price ID
- [ ] Checkout + Customer Portal from Settings → Billing
- [ ] Webhook updates `subscription_status` / Stripe IDs
- [ ] Soft banner when trial < 7 days
- [ ] Hard gates block invite / company villa / service order when expired
- [ ] Personal orgs never see Billing or gates

## Phase 4 — Hardening

- [ ] `NEXT_PUBLIC_DEMO_MODE=false` on production; demo credentials hidden
- [ ] Error monitoring (e.g. Sentry) + webhook logging
- [ ] Supabase PITR / backups enabled
- [ ] Storage lifecycle for villa photos and receipts
- [ ] Counsel-reviewed Terms + Privacy (replace placeholders)
- [ ] PWA audit on `app.pulseflow.site` (separate from marketing site)
- [ ] Multi-org membership + RLS smoke tests

## Phase 5 — Launch sequence

1. Staging: Supabase + Vercel preview + Stripe **test** mode
2. Checklist: register company → invite → job photo → bill → trial clock → subscribe → cancel → gates
3. Production: run migrations; create Stripe **live** products; point webhooks to prod
4. Optional: keep demo on staging or a `/demo` preview only
5. Soft launch; monitor auth + webhook errors

## Entitlement rule

`organization.kind === 'company'` AND (`trial_ends_at > now` OR `subscription_status in ('trialing','active')`).
