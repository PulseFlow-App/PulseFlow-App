# Pulse Flow - what it is, and features by audience

## Why this app exists

Pulse Flow is the shared operating system for rental villas: one place where owners, managers, field staff, and guests see the same live truth about properties, work, money, and stays.

Without it, everyone lives in WhatsApp threads, spreadsheets, and “I’ll check and get back to you.” Occupancy is unclear, jobs get lost, receipts go missing, and guests keep asking for Wi‑Fi and gate codes. Pulse Flow puts that pulse in one phone app so the company runs without constant chase-ups, and guests have a clean stay channel that never dumps them into the cleaning crew chat.

**Who it’s for**

| Audience | Why they need it |
|----------|------------------|
| **Owner** | See occupancy, urgent work, and spend without calling for a status update; pay for the company workspace |
| **Manager** | Run day-to-day ops and reports like an owner, without owning the company software bill |
| **Field staff** (cleaner / staff) | Know today’s jobs, confirm them, submit receipts, keep a reputation that travels |
| **Guest** | One stay hub: house guide, support to host only, deposit/bills, request next dates |
| **Personal** | Solo villas and light ops with no team (free forever) |

---

## Shared by almost everyone

| Feature | Detail |
|---------|--------|
| Sign in / sign out | Email + password |
| Face ID / passkeys | Optional fast sign-in after register or from Settings |
| Language | In-app language switcher |
| Edit your name | Settings → Name (all roles) |
| In-app notifications | Bell inbox (kinds vary by role) |
| Phone push (PWA) | Settings → Phone alerts; per account on that device; iPhone needs Home Screen install |
| Invite anyone | Personal referral link (`/register?from=…`); counts toward invite-5 → 1 year Full |
| Website + support links | Burger menu |
| Sign out | Settings |

---

## Owner (company)

**Job:** Run the company ops workspace and pay for Full (or trial / referral year).

### Everyday

- **Home dashboard** - occupancy pulse, urgent work, date strip, weekly spend chart  
- **Villas inventory** - status, check-in/out (auto from dates), cleaning, photos, map/location, notes  
- **House guide** per villa - Wi‑Fi, gate, bins, quiet hours, checkout checklist (visible to guests)  
- **Master info** per villa (team-only) - utilities, service providers, access/systems, key contacts, tax notes, handoff so someone else can run the property  
- **Maintenance log** per villa - item, date, description, vendor/brand, optional system photo  
- **Tasks** - create, assign, prioritize, complete across the company  
- **Contacts + Order** - vendor book; Call / WhatsApp / LINE; in-app Order to linked staff  
- **Jobs / service orders** - book linked contacts; track agree / complete / cancel  
- **Bills - finance** - all receipts, categories, multi-currency, mark paid  
- **Team chat** - company thread with @mentions (not guest support)  
- **Guests panel** (footer) - confirmed stays, record security deposit, send briefings (guest must tick as read), shortcut to date requests + support  
- **Date requests** - accept/decline guest stay dates; accept books villa dates and creates the stay  
- **Bookings calendar** - month grid of direct stays + Airbnb / Booking.com / VRBO nights; paste each listing’s private Export calendar (.ics) URL on the property → Sync  
- **Jobs → calendar** - download a job (or this week’s jobs) as `.ics` for Google / Apple Calendar  
- **Reports / exports** - CSV (bills, tasks, villas, jobs, occupancy), printable weekly ops, handoff snapshots  
- **Talent directory** - browse opted-in field talent by skills / place / map  
- **Endorsements / reviews** - weekly stars for the team  
- **Connect your agent** - Settings connection key + `npx @pulseflow/mcp` config so Cursor, Claude (or another AI agent) can list/create villas, tasks, and jobs in this workspace (no database key or local clone; revocable)  

### Company control

- **Rename organization** - Settings; name shows to team and guests  
- **Invite staff, managers, guests** - invite links / QR  
- **Villa access assignments** - which properties each field person sees  
- **Billing** - App Store Full subscription when live; trial window; referral progress (5 joins → 1 year Full)  

---

## Manager (company)

**Job:** Day-to-day ops like an owner, without paying or owning villa ACL.

### Same as owner (ops)

Home, villas (edit), house guides, tasks, contacts + Order, jobs, bills finance, team chat, Guests panel (deposit + briefings), date requests accept/decline, **Bookings calendar** + Airbnb/Booking.com iCal sync, talent browse, endorsements, **Connect your agent**, reports when company is entitled, invite staff / guests / anyone, referral progress, Face ID, push, rename own display name.

### Different from owner

| Has | Does not have |
|-----|----------------|
| Full day-to-day ops when company is on trial/Full | Company software billing ownership (App Store) |
| Reporting when company entitled | Villa access assignment UI (owner-only) |
| Invite managers + field + guests | Rename the company org (owner-only) |

### Multi-company + personal handoff

- **Several companies:** each company owner invites you as manager. One login keeps a membership per company. **Settings → Your companies** switches the active workspace (`profiles.org_id`). Your **personal** list stays available alongside.
- **Personal first, then owner:** add villas under **No company (personal)**. On Properties, **Invite owner** creates a handoff link: pick villas, owner email, and either **create a new company** or attach to **their existing company**. When they accept at `/handoff/{token}`, villas move into that company, they become **owner**, you stay **manager** (and a bookable contact), billing stays on the owner.
- Switching companies does **not** move personal villas. Handoff never pulls villas out of another company.

---

## Field staff (cleaner / staff)

**Job:** Do assigned work; light personal side ops; build a portable reputation.

### Field app

- **Field home** - jobs-first home  
- **Jobs** - work windows by property; Read & agreed; complete  
- **Villas** - only assigned / visible company properties  
- **Team chat** - company thread  
- **Bills** - submit own receipts (not company-wide finance)  
- **Talent profile** - opt in: skills, bio, location + map pin  
- **Reputation** - receive endorsements; share public `/u/{slug}`  
- **Invite anyone** only (referral) - no staff/guest company invites  
- **Personal villas** - optional side personal workspace for own clients  

### Not for field staff

Contacts Order booking UI, talent *browse*, reports CSV, mark-all-paid finance, villa ACL, guest invite, Guests panel, guest support inbox.

---

## Guest (invited stay guest)

**Job:** Stay informed, reach the host, see money held for the stay, book the next visit.

### Guest app (black footer only)

| Tab | What it does |
|-----|----------------|
| **Stay** | Confirmed stay: villa, dates, host notices, house guide, briefings (tick as read), arrival/departure photos |
| **Villas** | Browse this host’s company properties; request stay dates (calendar from **today** only) |
| **Support** | Chat with owner/manager only - **opens after a confirmed stay** |
| **Bills** | Security deposit held, deductions, remaining balance |

### Also

- Guest invite join flow → company guest role + personal workspace on signup  
- In-app + push notifications for stay updates (when push enabled on that account/device)  
- Edit own name, language, Face ID, phone alerts in Settings  

### Explicitly not for guests

Team chat with cleaners, contacts, talent, endorsements voting, company tasks/ops bills, Guests host panel.

---

## Personal workspace (solo)

**Job:** Own a few properties with no company team. Free forever. When you bring on a real owner for side clients, use **Invite owner** (handoff) so those villas move into their company while you stay manager.

| Has | Does not have |
|-----|----------------|
| Villas, tasks, own bills | Team invites, team chat, Order bookings |
| Contacts as a simple phone book | Company vendor Order / WA-LINE ops stack |
| Invite anyone (grow Pulse Flow) | Invite staff/guest into a company |
| Rename personal workspace (owner of that org) | App Store Full company billing, endorsements, talent browse, Guests panel |

---

## Quick matrix (shipped)

Legend: ● yes · ◐ limited · ○ no

| Feature | Owner | Manager | Field | Guest | Personal |
|---------|:-----:|:-------:|:-----:|:-----:|:--------:|
| Ops home dashboard | ● | ● | ○ | ○ | ● |
| Field jobs home | ○ | ○ | ● | ○ | ○ |
| Guest stay home | ○ | ○ | ○ | ● | ○ |
| Villas | ● | ● | ◐ | ◐ browse | ● |
| House guide edit | ● | ● | ○ | read | ○ |
| Tasks | ● | ● | ◐ | ○ | ● |
| Jobs / service orders | ● | ● | ● | ○ | ○ |
| Contacts + Order | ● | ● | ○ | ○ | ◐ call |
| Bills submit | ● | ● | ● | ○ | ● |
| Bills finance / mark paid | ● | ● | ○ | ○ | ◐ own |
| Guest deposit / charges view | ○ | ○ | ○ | ● | ○ |
| Set guest deposit (Guests) | ● | ● | ○ | ○ | ○ |
| Guest briefings | ● send | ● send | ○ | ● read | ○ |
| Date requests | ● accept | ● accept | ○ | ● request | ○ |
| Bookings calendar + OTA iCal import | ● | ● | ○ | ○ | ◐ |
| Jobs → .ics download | ● | ● | ● | ○ | ○ |
| Team chat | ● | ● | ● | ○ | ○ |
| Support chat (host↔guest) | ● | ● | ○ | ●* | ○ |
| Talent browse | ● | ● | ○ | ○ | ○ |
| Talent opt-in | ○ | ◐ | ● | ○ | ○ |
| Endorsements / reviews | ● | ● | ● | ○ | ○ |
| Reports / CSV | ● | ●† | ○ | ○ | ○ |
| Villa assignments | ● | ○ | ○ | ○ | ○ |
| Invite staff / guest | ● | ● | ○ | ○ | ○ |
| Invite anyone | ● | ● | ● | ● | ● |
| Rename org | ● | ○ | ○ | ○ | ● workspace |
| Edit own name | ● | ● | ● | ● | ● |
| Company billing | ● | ○ | ○ | ○ | ○ |
| Web push | ● | ● | ● | ● | ● |
| Face ID / passkeys | ● | ● | ● | ● | ● |
| Language | ● | ● | ● | ● | ● |

\* Support only after confirmed stay.  
† When company is entitled (trial / Full / referral year).

---

## Coming later (do not sell as live)

- Soft auto-archive of completed stays; richer host tools  
- Google Sheets sync; **subscribe** feed out to Google / Apple Calendar; LINE/WhatsApp ops alerts  

- Full channel-manager / PMS APIs (Hostaway, Guesty) — basic Airbnb/Booking.com **iCal import is already live**  
- Long-term tenant screening / e-lease (not Pulse Flow’s vacation-ops focus)  
- Full accounting product, “integrate with everything”

---

## Code / docs map

| Topic | Where |
|-------|--------|
| Role gates | `src/lib/roles.ts` |
| Guest stay + deposit + briefings | `src/app/(app)/guests/`, migrations `023`–`025` |
| Bookings calendar + OTA iCal import | `src/app/(app)/bookings/`, `src/lib/calendar/`, migration `055` |
| Jobs → calendar (.ics export) | `src/lib/export/job-calendar.ts`, Jobs page |
| Company vs personal | `docs/COMPANY_FEATURES.md` |
| Reports | `src/app/(app)/reports/`, `src/lib/export/ops-export.ts` |
| Push | `src/lib/push/`, Settings → Phone alerts |
