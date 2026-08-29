# Integrations & guest app — future steps

Status as of 2026-08-29. **CSV exports are done** (Reports). Everything below is parked for later.

---

## Done now

### CSV / Excel exports (`/reports`)

Available to entitled company owners and managers:

| Export | Columns / purpose |
|--------|-------------------|
| **Budget sheet** | `Month \| Property \| Category \| Amount \| Currency \| Paid? \| Description \| Date \| Receipt URL` — paste into Google Sheets / Excel for P&L |
| **Bills** | Full bill detail including receipt URL |
| **Tasks** | Ops task list |
| **Properties** | Villa inventory |
| **Jobs** | Service orders |
| **Occupancy** | Check-in / check-out / cleaning for planning |
| Filters | Date range + property |
| Also | Printable weekly summary, handoff snapshots |

Code: `src/lib/export/ops-export.ts`, `src/app/(app)/reports/page.tsx`.

---

## Near term (integrations)

### 1. Google Sheets sync

- “Connect Google Sheet” → append paid bills or weekly spend rollup
- Or scheduled nightly dump to a sheet they own
- Highest ROI after CSV for budget-minded owners

### 2. iCal feed

- Subscribe link for Google / Apple Calendar
- Events: check-in, check-out, booked jobs
- Reduces missed turnovers without another login

### 3. Bookkeeper pack (light)

- ZIP or single CSV of paid bills + receipt URLs (already partly in bills/budget CSV)
- Later: Xero / QuickBooks create only if enough users ask

---

## Medium

### 4. LINE / WhatsApp notify bridges

- Same events as in-app: job needs Read & agreed, bill submitted, check-in tomorrow
- Alerts only — not a CRM

### 5. Zapier / Make webhooks

- `bill.paid`, `job.completed`, `check_in.tomorrow`
- Power users only; most villa owners never open Zapier

---

## Later / if demanded

### 6. Channel / PMS

- Pull reservations → auto check-in/out + cleaning jobs
- Candidates: Hostaway, Guesty, or Airbnb iCal **import**
- Only after export + Sheets + calendar feel solid

### Avoid early

- Rebuilding Excel inside the app
- Full Xero clone
- “Integrate with everything”

### Positioning

> Pulse Flow runs the day-to-day. Your budget stays in Sheets/Xero — we export and sync the spend and schedule so you don’t retype receipts.

---

## Guest app MVP (in progress)

Lean loop agreed:

**invite → stay home + house guide → support chat → guest bills/deposit → company villas to request again**

### Shipped (needs migration `022`)

- `guest` role (DB + types + RLS-ready invites)
- Settings flip cards: Invite anyone / Invite staff / Invite guest
- Owner & manager: all three; staff/cleaner/guest: anyone only
- Join page copy for staff vs guest
- Guest home placeholder + guest bottom nav (Stay / Villas / Support / Bills)

### Next guest steps (build in order)

1. **Stay home** — current villa, dates, status notices from owner/manager
2. **House guide** — Wi‑Fi, gates, bins, quiet hours, checkout checklist (owner-editable)
3. **Support chat** — one thread per stay with **owner/manager only** (never cleaners)
4. **Guest bills / deposit** — guest-facing bills only (deposit held → deductions with photo → refund); arrival/departure photo set optional
5. **Company villas browse** — photos, area, sleeps; **Request dates** → owner/manager (no public booking engine yet)
6. Soft-expire guest access after checkout but keep deposit history + “book again”

### Guest access rules

- Join via stay invite link only (not open signup as guest)
- No contacts directory, talent, endorsements, or internal ops bills
- Emergency phone note ok; app for everything else

---

## Related migrations to run

| Migration | Purpose |
|-----------|---------|
| `020_job_search_location.sql` | Talent location |
| `021_endorsements_manager.sql` | Managers can endorse |
| `022_guest_role.sql` | Guest role + invites |

---

## When continuing

1. Confirm migrations applied on Supabase  
2. Pick next slice: **guest stay home + house guide**, or **Google Sheets sync**  
3. Keep CSV as the baseline; don’t block guest MVP on Sheets/iCal
