# Pulse Flow - what it is, and features by audience

## Why this app exists

Pulse Flow is the shared operating system for rental villas: one place where owners, managers, field staff, and guests see the same live truth about properties, work, money, and stays.

Without it, everyone lives in WhatsApp threads, spreadsheets, and “I’ll check and get back to you.” Occupancy is unclear, jobs get lost, receipts go missing, and guests keep asking for Wi‑Fi and gate codes. Pulse Flow puts that pulse in one phone app so the company runs without constant chase-ups, and guests have a clean stay channel that never dumps them into the cleaning crew chat.

**Who it’s for**

| Audience | Why they need it |
|----------|------------------|
| **Owner** | See occupancy, urgent work, and spend without calling for a status update; pay for the company workspace |
| **Manager** | Run day-to-day ops and reports like an owner, without owning the Stripe bill |
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
- **Tasks** - create, assign, prioritize, complete across the company  
- **Contacts + Order** - vendor book; Call / WhatsApp / LINE; in-app Order to linked staff  
- **Jobs / service orders** - book linked contacts; track agree / complete / cancel  
- **Bills - finance** - all receipts, categories, multi-currency, mark paid  
- **Team chat** - company thread with @mentions (not guest support)  
- **Guests panel** (footer) - confirmed stays, record security deposit, send briefings (guest must tick as read), shortcut to date requests + support  
- **Date requests** - accept/decline guest stay dates; accept books villa dates and creates the stay  
- **Reports / exports** - CSV (bills, tasks, villas, jobs, occupancy), printable weekly ops, handoff snapshots  
- **Talent directory** - browse opted-in field talent by skills / place / map  
- **Endorsements + leaderboard** - weekly stars for the team  

### Company control

- **Rename organization** - Settings; name shows to team and guests  
- **Invite staff, managers, guests** - invite links / QR  
- **Villa access assignments** - which properties each field person sees  
- **Billing** - Stripe Full subscription / portal; trial window; referral progress (5 joins → 1 year Full)  

---

## Manager (company)

**Job:** Day-to-day ops like an owner, without paying or owning villa ACL.

### Same as owner (ops)

Home, villas (edit), house guides, tasks, contacts + Order, jobs, bills finance, team chat, Guests panel (deposit + briefings), date requests accept/decline, talent browse, endorsements, reports when company is entitled, invite staff / guests / anyone, referral progress, Face ID, push, rename own display name.

### Different from owner

| Has | Does not have |
|-----|----------------|
| Full day-to-day ops when company is on trial/Full | Stripe company billing ownership |
| Reporting when company entitled | Villa access assignment UI (owner-only) |
| Invite managers + field + guests | Rename the company org (owner-only) |

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
- **Reputation** - receive endorsements; share public `/u/{slug}`; company leaderboard  
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

**Job:** Own a few properties with no company team. Free forever.

| Has | Does not have |
|-----|----------------|
| Villas, tasks, own bills | Team invites, team chat, Order bookings |
| Contacts as a simple phone book | Company vendor Order / WA-LINE ops stack |
| Invite anyone (grow Pulse Flow) | Invite staff/guest into a company |
| Rename personal workspace (owner of that org) | Stripe Full company billing, endorsements, leaderboard, talent browse, Guests panel |

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
| Team chat | ● | ● | ● | ○ | ○ |
| Support chat (host↔guest) | ● | ● | ○ | ●* | ○ |
| Talent browse | ● | ● | ○ | ○ | ○ |
| Talent opt-in | ○ | ◐ | ● | ○ | ○ |
| Endorsements / leaderboard | ● | ● | ● | ○ | ○ |
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
- Google Sheets / iCal / LINE-WhatsApp ops bridges (see `INTEGRATIONS_ROADMAP.md`)  
- Full accounting product, “integrate with everything”

---

## Code / docs map

| Topic | Where |
|-------|--------|
| Role gates | `src/lib/roles.ts` |
| Guest stay + deposit + briefings | `src/app/(app)/guests/`, migrations `023`–`025` |
| Company vs personal | `docs/COMPANY_FEATURES.md` |
| Reports | `src/app/(app)/reports/`, `src/lib/export/ops-export.ts` |
| Push | `src/lib/push/`, Settings → Phone alerts |
