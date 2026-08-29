# Pulse Flow - feature matrix by audience

Use this to redesign **in-app / marketing guides** per group (owners, managers, field staff, guests, personal users).  
Status: **shipped** vs **planned** are separated. Guest stay tools beyond invite/shell are mostly planned.

**Audiences**

| ID | Who | Workspace |
|----|-----|-----------|
| **Owner** | Company owner (pays Full / trial / referral year) | Company |
| **Manager** | Invited management | Company |
| **Field staff** | Cleaner + staff roles (same field app) | Company (+ optional personal side villas) |
| **Guest** | Stay guest invited by owner/manager | Company membership as `guest` (+ personal org on signup) |
| **Personal** | Solo owner of a personal workspace | Personal (free) |

Field staff = **cleaner** and **staff** (same simplified nav). Guides can say “field team” unless a difference matters.

---

## 1. Common (shared by almost everyone with an account)

These belong in every group’s guide intro (wording can change; capability is shared).

| Feature | Notes |
|---------|--------|
| Sign in / sign out | Email/password; passkeys where enabled |
| Language | Settings language switcher; `?lang=` on marketing |
| Profile basics | Name, email, role label |
| Notifications (in-app) | Bell + list; kinds vary by role |
| Web Push (PWA) | Optional phone alerts - Settings → Phone alerts |
| Invite anyone | Referral register link → `/register` (personal vs company). Counts toward “invite 5 → 1 year Full” when credited |
| Public reputation profile | `/u/{slug}` for non-owners (stars from endorsements). Guests: low priority in guide |
| Brand / Settings | App name, support email, legal links, sign out |

**Not common:** team chat, talent browse, reports/CSV, villa assignments, guest stay tools, contacts Order, endorsements voting.

---

## 2. Unique / primary by category (shipped)

### A. Owner (company)

**Core job:** Run the company ops workspace and pay for Full.

| Unique or owner-led | Detail |
|---------------------|--------|
| Company billing | Stripe checkout / portal; trial & Full entitlement |
| Villa access assignments | Assign which properties field staff can see |
| Full property inventory | Company villas; status, check-in/out, cleaning, photos, maps |
| Owner home dashboard | Status tiles, urgent tasks, date strip, weekly chart |
| Tasks (full) | Create / assign / complete across company |
| Contacts + Order | Vendor book; in-app Order for linked staff; WA/LINE links |
| Bills - finance view | All bills, category spend, multi-currency, mark paid |
| Reports / CSV | Budget sheet, bills, tasks, properties, jobs, occupancy; weekly print; handoff snapshots |
| Talent directory | Browse opted-in staff by skill / place / map |
| Endorsements | Cast weekly stars; reviews from Contacts |
| Team chat | Company messages + @mentions |
| Invite staff + invite guest | Flip cards in Settings (plus invite anyone) |
| Invite managers | Via staff invite role picker |
| Referral progress | 5 joins → 1 year Full |
| Jobs / service orders | Book linked contacts; cancel / track |
| Leaderboard | Company reputation board |

### B. Manager (company)

**Core job:** Day-to-day ops like an owner, without paying or assigning villa ACL.

| Same as owner (ops) | Difference from owner |
|---------------------|------------------------|
| Home dashboard, villas (edit core), tasks, contacts+Order, bills finance, team chat, talent, endorsements (cast), jobs, reports/CSV when company entitled, invite staff/guest/anyone, referral progress | **No** Stripe billing ownership |
| | **No** villa access assignment UI (owner-only) |
| | Reporting / extended history tied to company entitlement (Full includes managers) |
| | Can invite managers + field staff + guests (same flip cards as owner) |

### C. Field staff (cleaner / staff)

**Core job:** Do assigned work on the island; light personal side ops.

| Unique / field-app | Detail |
|--------------------|--------|
| Field home | Jobs-focused home (`StaffHome`) |
| Jobs | Work windows by property (not guest check-in times) |
| Villas (limited) | Assigned / visible properties; less owner chrome |
| Team chat | Company chat |
| Bills - submit | Own receipts; not full finance totals |
| Personal villas | Side personal org / personal villas for own clients |
| Talent opt-in | Settings: skills, bio, **location + map pin** |
| Reputation | Receive endorsements; share `/u/{slug}`; see leaderboard as team member |
| Invite anyone only | No staff/guest invite cards |
| **No** | Contacts Order, talent browse, reports CSV, mark-all-bills-paid finance, villa ACL, guest invite |

### D. Guest (company guest role)

**Core job:** Stay updated, ask support, see deposit/bills, return for next trip.

| Shipped (demo + migration 023) | Detail |
|-------------|------------------|
| Guest role + invite link | Owner/manager “Invite your guest” → `/join/{token}` |
| Stay home | Villa, dates, owner notices, house guide, arrival/departure photos |
| House guide | Wi‑Fi, gate, bins, quiet hours, checkout - owner/manager editable on villa |
| Support chat | One thread per stay; guest ↔ owner/manager only |
| Guest bills / deposit | Held deposit + deductions with remaining balance |
| Company villas browse | Catalog + request dates |
| Guest nav | Stay · Villas · Support · Bills |

| Explicitly **not** for guests | |
|-------------------------------|--|
| Team chat with cleaners | Support chat only with **owner/manager** |
| Contacts / talent / endorsements vote | Hidden |
| Internal ops bills / tasks | Guest-facing deposit & charges only |

### E. Personal workspace (solo)

**Core job:** Own properties without a company team.

| Has | Does not have |
|-----|----------------|
| Villas, tasks, bills (own) | Team invites, team chat, Order bookings, endorsements, leaderboard, talent browse, villa ACL |
| Contacts as phone book (call) | WA/LINE / Order as company vendors |
| Invite anyone (grow Pulse Flow) | Invite staff / guest into a company |
| Free forever | Stripe company Full |

---

## 3. Matrix (shipped) - quick scan

Legend: ● = yes · ◐ = limited / own only · ○ = no · ▢ = shell / invite only

| Feature | Owner | Manager | Field | Guest | Personal |
|---------|:-----:|:-------:|:-----:|:-----:|:--------:|
| Home (ops dashboard) | ● | ● | ○ | ○ | ● |
| Field jobs home | ○ | ○ | ● | ○ | ○ |
| Guest stay home | ○ | ○ | ○ | ▢ | ○ |
| Villas | ● | ● | ◐ | ▢ | ● |
| Tasks | ● | ● | ◐ | ○ | ● |
| Jobs / orders | ● | ● | ● | ○ | ○ |
| Contacts + Order | ● | ● | ○ | ○ | ◐ call |
| Bills submit | ● | ● | ● | ▢ | ● |
| Bills finance / mark paid | ● | ● | ○ | ○ | ◐ own |
| Multi-currency bills | ● | ● | ● | - | ● |
| Team chat | ● | ● | ● | ○* | ○ |
| Talent browse | ● | ● | ○ | ○ | ○ |
| Talent opt-in + location | ○ | ◐ | ● | ○ | ○ |
| Endorsements cast | ● | ● | ○ | ○ | ○ |
| Reputation / leaderboard | ● | ● | ● | ○ | ○ |
| Reports / CSV | ● | ●† | ○ | ○ | ○ |
| Villa assignments | ● | ○ | ○ | ○ | ○ |
| Invite anyone | ● | ● | ● | ● | ● |
| Invite staff | ● | ● | ○ | ○ | ○ |
| Invite guest | ● | ● | ○ | ○ | ○ |
| Company billing (Stripe) | ● | ○ | ○ | ○ | ○ |
| Web Push | ● | ● | ● | ● | ● |
| Language | ● | ● | ● | ● | ● |

\* Planned: guest **support** chat ≠ team chat.  
† When company is entitled (Full / trial / referral year).

---

## 4. Planned features (mention in guides as “coming” / roadmap)

Keep these in a separate “Coming soon” section so Claude doesn’t describe them as live.

### 4a. Guest stay MVP - shipped in demo (apply migration 023 for Supabase)

Stay home, house guide, support chat (owner/manager only), deposit/charges, arrival photos, villa browse + date requests are live in demo mode. Soft-expire after checkout and richer host reply inbox can still deepen.

### 4b. Integrations (after CSV - already shipped)

| Near | Medium | Later |
|------|--------|-------|
| Google Sheets sync (paid bills / weekly spend) | LINE / WhatsApp ops alerts | Zapier/Make webhooks |
| iCal subscribe (check-in/out, jobs) | Bookkeeper pack polish | One PMS / Airbnb iCal import |
| | | |

**Do not promise early:** full accounting product, “integrate with everything.”

### 4c. Product polish already discussed but not guide-critical

- Richer guest-facing copy & marketing pages for guest invite  
- Further talent/map polish  
- Push coverage for every event type  

---

## 5. Guide structure (marketing pages)

Per audience page (`/owners`, `/employees`, `/staff`, `/guests`):

1. **Hero** - one line + short sub + CTA (no screenshot)
2. **What you use every day** - 3-4 flagship features with phone-framed screenshots (placeholders where assets are missing)
3. **Everything included** - 2-3 text bullet clusters, zero screenshots
4. **Coming soon** - only where relevant (mainly Guest)
5. Demo + CTA

Do **not** add a “What you don't see” section on Owner / Manager / Field guides - it kills close energy and belongs (if anywhere) as an optional footer cross-link, not a negative block before the CTA. Guest may keep a short boundary note where it prevents real confusion (e.g. never message cleaners).

**Screenshot budget:** Owner 4 · Manager reuses Owner home/villas + chat + reports placeholder · Field 3 + optional talent placeholder · Guest 0-1 shell placeholder · Personal = reuse Owner villas caption only (no fifth card; one line under Plans).

Selector on home: Owner, Manager, Field staff, Guest (lighter card), Personal mention under pricing.

---

## 6. Source of truth in code / docs

| Topic | Where |
|-------|--------|
| Role gates | `src/lib/roles.ts` |
| Company vs personal | `docs/COMPANY_FEATURES.md` |
| Integrations + guest roadmap | `docs/INTEGRATIONS_ROADMAP.md` |
| Reports CSV | `src/app/(app)/reports/page.tsx`, `src/lib/export/ops-export.ts` |
| Invite flip cards | `src/components/settings/invite-flip-cards.tsx` |
| Guest migration | `supabase/migrations/022_guest_role.sql` |

Update this file when a planned row ships so marketing guides stay accurate.
