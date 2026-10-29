# Production launch checklist

## Phase 0 - Foundations

- [x] Supabase project created (staging + production)
- [x] Env vars set in Vercel / `.env.local` from `.env.example`
- [x] Migrations `001` → `010` applied in order on each project
- [x] `npm run seed` succeeds on staging
- [x] Seeded owner can open `/home` with `NEXT_PUBLIC_DEMO_MODE=false`

## Phase 1 - Auth

- [x] Register personal owner end-to-end
- [x] Register company owner (trial fields set, `subscription_status=trialing`)
- [x] Create invite from Settings; accept on `/join/[token]`
- [x] Email confirm / magic link via `/auth/callback` if confirmation enabled
- [x] Middleware refreshes session cookies on App Router navigations

## Phase 2 - Parity

- [ ] Service orders: book → agree → complete
- [x] Personal villas via `personal_org_id` / ensure-personal API
- [x] Villa photo upload to Storage bucket `villas` (not data URLs)
- [x] Receipts upload to `receipts`
- [x] Notifications + endorsements load and update
- [x] Realtime updates for messages / orders / notifications

## Phase 3 - Billing

- [ ] App Store Connect Company / Pro subscription products
- [ ] App Store IAP purchase + restore from Settings → Plan (when iOS live)
- [ ] App Store Server Notifications update `subscription_status` / entitlements
- [ ] Soft banner when trial < 7 days
- [ ] Hard gates block invite / company villa / service order when expired
- [ ] Personal orgs never see Billing or gates

## Phase 4 - Hardening

- [ ] Apply migration `036_mvp_security_hardening.sql` (guest RLS + entitlement expiry) if not already on prod
- [ ] Apply migration `058_drop_stripe_billing_columns.sql`
- [x] Apply migration `059_scale_security_hardening.sql` (role/org locks, private receipts, staff RLS, push dedupe)
- [x] Run `docs/SECURITY_AUDIT_059.sql` (Oct 2026): 3 personal owners missing `org_memberships` — backfilled; 0 `active` company orgs (2 `trialing`); no billing self-promotion found
- [ ] `NEXT_PUBLIC_DEMO_MODE=false` on production; demo credentials hidden
- [ ] Error monitoring: `@sentry/nextjs` wired — set `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` on Vercel (optional `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` for source maps)
- [ ] Apply migration `060_audit_view_security_invoker.sql` (audit view security_invoker + service_role only)
- [ ] Supabase PITR / backups: enable in Dashboard → Project → Database → Backups (Pro plan; Management API login required from this machine)
- [ ] Storage lifecycle for villa photos and receipts
- [x] Counsel-reviewed Terms + Privacy (Horizon legal rewrite Oct 2026)
- [x] PWA audit on `app.pulseflow.site` (manifest icons/maskable, zoomable viewport, apple-touch, legal URLs) - native Store binary still open; see `docs/APPLE_APP_STORE_PREP.md`
- [ ] Multi-org membership + RLS smoke tests
- [x] Cron: middleware allows `/api/cron`; ran schedule-alerts to `done: true` (4 candidates, 6 pushes, 2 company orgs). Prod still needs the middleware deploy so Vercel Cron is not redirected to `/login`

## Phase 5 - Launch sequence

1. Staging: Supabase + Vercel preview + App Store Sandbox IAP
2. Checklist: register company → invite → job photo → bill → trial clock → subscribe → cancel → gates
3. Production: run migrations; App Store live products; point server notifications to prod
4. Optional: keep demo on staging or a `/demo` preview only
5. Soft launch; monitor auth + App Store notification errors

## Entitlement rule

`organization.kind === 'company'` AND (`trial_ends_at > now` OR `subscription_status in ('trialing','active')`).
