# Education mode — truth check & acceptance

Date: 2026-10-31

## Live enrich probes (`/api/listings/enrich`)

| Source | Result | Tour implication |
| --- | --- | --- |
| Airbnb listing URL | Product-confirmed usable for Quick fill (listing fields) and for calendar export (.ics) import | Name **Airbnb** for Quick fill and calendar |
| Booking.com listing URL | Often WAF / bot challenge (“thin”) for enrich | Do **not** name Booking for Quick fill; OK for calendar export import |
| Guesty public marketing / listing page | Not a supported listing parse target for Quick fill | Do **not** name Guesty for Quick fill; OK for calendar export / Guesty Settings sync |
| Paste notes / partial HTML | Best-effort fill of name, location, amenities when present | Keep notes path in Quick fill wording |
| Photos | Not reliably applied into the create form | Do not claim photo import |

Fallback copy path already exists: “We couldn't read this link. Please fill in the details.”

## Calendar / phone / settings truth

| Claim | Reality | Tour / UI |
| --- | --- | --- |
| Calendar sync | One-way **import** of private `.ics` on user action (`/api/calendar/sync-ical`). No cron re-pull. Not two-way. | Say **import**. Label `villas.icalSync` → **Import**. Keep Guesty “Sync listings” as API sync. |
| Phone calendar | Downloads `.ics` (`job-calendar.ts`) | “Add jobs to your phone calendar” — never “sync” |
| Themes | Frost / Dark | Step 6 names Frost or Dark |
| Translation | “Translate team content” | Step 6 |
| Passkeys | Face ID / Touch ID sign-in | Step 6 |
| Contacts Invite | No Invite on Contacts; invites via Company / menu | Target Add + `nav-invites` |

## Pricing / founding / demo

- Personal: free unlimited properties; Company USD 15 / 10 seats / **USD 2** extra — unchanged.
- Founding offer defined in Terms — unchanged.
- Site soft-pass: no contradictory “unlimited free seats” product copy found in live site i18n; internal marketing docs may still say “free seats” for staff-on-company (different claim).
- Demo: no education auto-start, no DB progress writes.

## Behaviour shipped

- Flag: `NEXT_PUBLIC_EDUCATION_MODE` (default on; `0`/`false`/`off` disables).
- DB: `065_education_progress.sql` + `GET/PATCH /api/education/progress` (RLS own row).
- Owners/managers only; staff/guest/demo excluded.
- Spotlight + bottom sheet / chip / checklist; burger Resume / Start again.
- Events emitted after create property/contact/job/task and calendar save / check-in.
- Six steps with truth-checked EN copy (`// REVIEW` in `en.ts`); locale stubs present.

## Screenshots

Saved under `docs/education-screenshots/` via public `/education-preview` (mock chrome + real sheet copy):

| Viewport | Steps / states |
| --- | --- |
| 360 frost | properties, calendar, contacts, work, home, settings, finished, chip, checklist |
| 1440 frost | properties, calendar, contacts, work, home, settings |
| Dark | properties 1440, settings 360 + 1440 (sheet text readable on dark card) |

## Files changed (Education rebuild)

- `supabase/migrations/065_education_progress.sql`
- `src/app/api/education/progress/route.ts`
- `src/lib/env.ts`, `.env.example` (`NEXT_PUBLIC_EDUCATION_MODE`)
- `src/lib/education/{events,steps,storage,provider}.ts(x)`
- `src/components/education/{education-tour,spotlight,tour-sheet,checklist}.tsx`
- `src/components/layout/{app-shell,app-menu,bottom-nav}.tsx` (+ `data-tour`)
- Emit sites: `use-app-data.ts`, `use-supabase-data.ts`
- Targets: villas/contacts/jobs/tasks/settings pages, quick-fill, calendar-import, home-focus
- i18n: `en.ts` (+ locale stubs); `villas.icalSync` → Import
- `src/lib/supabase/middleware.ts` (public `/education-preview`)
- `src/app/education-preview/page.tsx` (acceptance mock)
- `docs/EDUCATION_MODE_TRUTH_REPORT.md`, `docs/education-screenshots/*`

Apply migration `065` in prod when deploying. Demo / staff / guest: no tour.
