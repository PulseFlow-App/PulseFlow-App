# Integrations & guest app - future steps

Status as of 2026-10-26. **CSV exports**, **Airbnb / Booking.com iCal import**, and **jobs → .ics download** are live. Everything below is parked for later.

---

## Done now

### CSV / Excel exports (`/reports`)

Available to entitled company owners and managers:

| Export | Columns / purpose |
|--------|-------------------|
| **Budget sheet** | `Month \| Property \| Category \| Amount \| Currency \| Paid? \| Description \| Date \| Receipt URL` - paste into Google Sheets / Excel for P&L |
| **Bills** | Full bill detail including receipt URL |
| **Tasks** | Ops task list |
| **Properties** | Villa inventory |
| **Jobs** | Service orders |
| **Occupancy** | Check-in / check-out / cleaning for planning |
| Filters | Date range + property |
| Also | Printable weekly summary, handoff snapshots |

Code: `src/lib/export/ops-export.ts`, `src/app/(app)/reports/page.tsx`.

### Airbnb / Booking.com / VRBO calendar **import**

- Paste each listing’s private Export calendar (.ics) URL on the property → Sync
- Pulls reserved / blocked nights into `villa_calendar_bookings`
- Month grid at `/bookings` (Menu → Bookings calendar; link from Guests)
- Updates villa check-in / check-out pulse from the next open block

Code: `src/lib/calendar/`, `src/app/api/calendar/sync-ical/`, migration `055_villa_calendar_import.sql`.

### Jobs → calendar download

- Per appointment or “this week” `.ics` download on Jobs (opens in Google / Apple Calendar)

Code: `src/lib/export/job-calendar.ts`, Jobs page.

---

## Near term (integrations)

### 1. Google Sheets sync

- “Connect Google Sheet” → append paid bills or weekly spend rollup
- Or scheduled nightly dump to a sheet they own
- Highest ROI after CSV for budget-minded owners

### 2. iCal **subscribe** feed (export out)

- Subscribe link for Google / Apple Calendar
- Events: check-in, check-out, booked jobs
- Complements the existing OTA **import** and jobs `.ics` download

### 3. Bookkeeper pack (light)

- ZIP or single CSV of paid bills + receipt URLs (already partly in bills/budget CSV)
- Later: Xero / QuickBooks create only if enough users ask

---

## Medium

### 4. LINE / WhatsApp notify bridges

- Same events as in-app: job needs Read & agreed, bill submitted, check-in tomorrow
- Alerts only - not a CRM

### 5. Zapier / Make webhooks

- `bill.paid`, `job.completed`, `check_in.tomorrow`
- Power users only; most villa owners never open Zapier

---

## Later / if demanded

### 6. Channel / PMS APIs

- Pull reservations → auto check-in/out + cleaning jobs
- Candidates: Hostaway, Guesty (full API)
- Basic Airbnb / Booking.com **iCal import** is already live; PMS APIs only if users outgrow feeds

### Avoid early

- Rebuilding Excel inside the app
- Full Xero clone
- “Integrate with everything”

### Positioning

> Pulse Flow runs the day-to-day. Your budget stays in Sheets/Xero - we export and sync the spend and schedule so you don’t retype receipts. Channel bookings stay on Airbnb / Booking.com; paste their calendar export to see nights in the app.

---

## Guest app

Guest stay loop (invite → stay home + house guide → support → deposits → request dates) is largely shipped. Soft-expire after checkout and richer host tools remain later.

---

## Related migrations

| Migration | Purpose |
|-----------|---------|
| `055_villa_calendar_import.sql` | Villa iCal URL + `villa_calendar_bookings` |

---

## When continuing

1. Confirm migration `055` applied on Supabase  
2. Next slice: **Google Sheets sync** or **iCal subscribe** (export out)  
3. Keep CSV as the baseline for bookkeepers  
