# Hotel vertical — architecture review + implementation prompt

**Status:** Review draft for product / eng  
**Date:** 2026-10-17  
**Context:** Pulse Flow today is villa / short-term rental ops (`main`). There is **no `hotel` git branch yet** on origin; this doc defines how to open one and what to build.  
**Companion:** [`UX_SIMPLIFICATION_REVIEW.md`](./UX_SIMPLIFICATION_REVIEW.md) (tap economy — apply the same rules here).

---

## Part A — Architecture review (for humans)

### A1. Why a separate hotel “branch” (product + git)

| Layer | Recommendation |
|-------|----------------|
| **Git** | Long-lived branch `hotel` cut from `main`, merge selective shared fixes back. Avoid forever-fork of auth/billing. |
| **Product** | Same Pulse identity + Horizon design, different **vertical**: `organizations.vertical = 'villas' \| 'hotel'`. |
| **App shell** | Shared Next app; at login / org switch, load **Hotel shell** vs **Villa shell** (nav, home, copy, inventory model). |
| **Guest app** | Same guest role pattern, different stay object (hotel reservation + room) and front-desk support channel. |

**Do not** stretch `villas` rows to mean “rooms” with a type flag alone. Hotels need room inventory, HK board, and multi-room stays; villas need whole-home occupancy. Shared primitives: org, profile, roles, invites, chat, bills, endorsements, push, agent/MCP later.

### A2. Domain model (hotel)

```
Organization (kind: company|personal, vertical: hotel)
  └── HotelProfile (1 per org, or 1:N later for chains)
        ├── buildings[] (optional wing/tower)
        ├── floors[]
        └── rooms[]  (number, type, capacity, status)
              └── RoomStatusEvent[] (HK / OO / inspection trail)

Reservation (guest stay at hotel)
  ├── guest_profile_id
  ├── room_id (nullable until assigned)
  ├── check_in / check_out (datetime, not only date)
  ├── status: inquiry|confirmed|checked_in|checked_out|cancelled|no_show
  └── folio / deposit / charges → reuse bills patterns where possible

WorkOrder (hotel jobs — maps from service_orders mentally)
  ├── room_id | public_area
  ├── kind: housekeeping|maintenance|guest_request|turnover
  ├── assignee, schedule, agree/done/verify
  └── photo proof

HousekeepingBoard (derived view, not only a table)
  └── room × status today: dirty|cleaning|clean|inspected|ooo|blocked
```

**Reuse from villas with rename in UI only when isomorphic:**

| Villas | Hotel |
|--------|--------|
| Villa | Room (inventory unit) + HotelProfile (property) |
| GuestStay | Reservation |
| House guide | Room / hotel guide (Wi‑Fi, breakfast, checkout) |
| Master info | Hotel ops file (vendors, access, SOPs) |
| Service order / task | Work order (HK + maintenance + guest request) |
| Contacts Order | Book vendor / assign HK task |
| Support messages | Guest ↔ front desk (not HK chat) |

### A3. Roles & login

| Role | Hotel meaning | Shell |
|------|---------------|--------|
| `owner` | Hotel owner / GM (billing) | Hotel ops |
| `manager` | Front office manager / ops lead | Hotel ops |
| `staff` | Front desk / ops generalist | Hotel ops (desk-focused Home) |
| `cleaner` | Housekeeping | Field / HK board |
| `guest` | In-house or pre-arrival guest | Guest stay app |

**Hotel profile creation (staff/owner):**

1. Register → choose vertical **Hotel** (or invite into hotel org)  
2. **Create hotel profile** wizard: name, address/maps, star class optional, photo, timezone, check-in/out defaults  
3. Import or add **rooms** (bulk CSV / “20 rooms floor 2” generator)  
4. Invite front desk + HK  
5. Optional: guest invite / booking link  

Personal workspace for hotel vertical = “boutique / B&B solo” (few rooms, no team) — mirror personal villas free tier.

### A4. Operations surfaces (hotel ops app)

**Bottom nav (hotel company):**

1. **Home** — action queue: arrivals today, departures, dirty rooms, open guest requests, OO rooms  
2. **Rooms** — inventory + HK board (default view = board, toggle list)  
3. **Stays** — reservations / in-house (merge “guests + date requests”)  
4. **Work** — work orders (HK + maintenance)  
5. **More** — bills, contacts, chat, settings, invites  

**Staff/HK nav:** Home (my rooms + agrees) · Board · Work · Chat · Bills  

**Critical hotel workflows (must be ≤2 taps where possible):**

| Workflow | Design |
|----------|--------|
| Room dirty → clean → inspected | Board cell tap cycles or opens sheet with one primary |
| Assign HK to departure rooms | Multi-select dirty + Assign |
| Guest request (“towels”) | Guest app → work order to HK with room # |
| Check-in | Stays → Assign room (if needed) → Check in → status occupied |
| Check-out | Mark departed → room dirty auto |
| Maintenance | Work order on room / public area |

### A5. Guest app (hotel)

Same isolation rules as villa guests: **never** team chat; support → front desk only.

**Guest Home = one stay card:**

- Hotel name + room number (when assigned)  
- Check-in / out times  
- **Guide:** Wi‑Fi, breakfast, parking, house rules  
- **Request:** towels, cleaning, late checkout, issue (→ work order)  
- **Message front desk**  
- **Folio / deposit / bills**  
- Pre-arrival: confirm reservation, upload ID optional (phase 2), early check-in request  

### A6. Platform architecture (technical)

```
src/
  lib/vertical.ts          # resolveVertical(org) → 'villas' | 'hotel'
  app/(app)/               # shared layout; shells branch inside
  components/hotel/        # hotel-only UI
  components/villas/       # existing
  lib/hotel/               # room status, board, reservation helpers
supabase/migrations/
  06x_hotel_vertical.sql   # vertical enum, hotel_profiles, rooms, reservations, …
```

**RLS:** same org membership model; guests only see own reservation + that hotel’s guest guide.  
**Billing:** reuse company trial/Full; hotel plan copy on marketing later.  
**Agent/MCP:** phase 2 tools `pulse_list_rooms`, `pulse_set_room_status`, etc.  
**Demo mode:** `demoHotelSeed` parallel to villa seed.

### A7. Branch strategy

1. Create `hotel` from `main`.  
2. Land schema + vertical flag + hotel shell behind `vertical === 'hotel'`.  
3. Villa code paths must no-op / hide for hotel orgs (and reverse).  
4. Shared bugfixes: cherry-pick or merge `main` → `hotel` weekly.  
5. Ship hotel when board + stays + guest stay card work; don’t block on F&B/POS.

### A8. Out of scope for v1

- Channel manager / Booking.com sync  
- Full PMS rate plans / overbooking engine  
- POS / restaurant  
- Key cards / smart locks  
- Multi-hotel chain dashboard (schema allows later via multiple HotelProfiles)

### A9. Success criteria (v1)

- Owner creates hotel profile + 10 rooms in &lt; 5 minutes  
- HK changes 10 room statuses from board without leaving Home/Board  
- Guest opens app, sees room Wi‑Fi, sends towel request, front desk sees work order  
- Villa orgs unaffected on `main` behavior  

---

## Part B — Ready prompt to implement

Paste everything below into a coding agent on branch `hotel` (create from `main` first if missing).

---

### PROMPT START

You are implementing the **Pulse Flow Hotel vertical** in this monorepo (Next.js App Router + Supabase + existing villa ops app).

#### Mission

Ship a **hotel operations mode** alongside villas, selectable per organization (`vertical`), with:

1. Hotel profile creation + staff login into a **hotel ops shell**  
2. Room inventory + **housekeeping board** + work orders  
3. Reservations / in-house stays  
4. **Guest app** for hotel stays (guide, requests, front-desk messaging, bills)  

Follow Horizon design (`docs/DESIGN.md`) and tap-economy rules (`docs/UX_SIMPLIFICATION_REVIEW.md`): action queues on Home, progressive disclosure, ≤2 taps for HK status and guest requests.

#### Non-negotiables

- Do **not** break villa orgs (`vertical = 'villas'` or null treated as villas).  
- Guests must **never** see team chat; hotel guest support = front desk channel only (mirror villa guest isolation).  
- Reuse auth, profiles, orgs, invites, bills, push, busy overlay, i18n patterns.  
- No channel-manager / POS / smart locks in v1.  
- Mobile-first; RTL-safe.  
- Prefer extending schema + shells over renaming `villas` table into rooms.

#### Phase 0 — Branch & vertical flag

1. Ensure git branch `hotel` exists from latest `main`.  
2. Migration: add `organizations.vertical text not null default 'villas' check (vertical in ('villas','hotel'))`.  
3. `src/lib/vertical.ts`: `getOrgVertical(org)`, `isHotelVertical`, `isVillaVertical`.  
4. On register / create company / ensure-personal: allow choosing vertical (hotel vs villas) for new company orgs; default villas for existing.  
5. Data layer exposes `vertical` on organization; app shell switches nav + Home by vertical + role.

#### Phase 1 — Schema

Create migrations (hotel branch) for approximately:

- `hotel_profiles` — `org_id unique`, name, area, location_url, photo_url, timezone, default_check_in_time, default_check_out_time, description, listing_url, drive_url, info_doc_url, info_doc_name, source_notes, created_at, updated_at  
- `hotel_rooms` — org_id, hotel_profile_id, building, floor, room_number, room_type, max_guests, status (`dirty|cleaning|clean|inspected|occupied|ooo|blocked`), notes, sort_order  
- `hotel_reservations` — org_id, hotel_profile_id, guest_profile_id, room_id null, check_in timestamptz, check_out timestamptz, status (`inquiry|confirmed|checked_in|checked_out|cancelled|no_show`), guest_notes, created_by, …  
- Reuse or parallel: work via `service_orders` + `tasks` with `room_id` nullable FK **or** new `hotel_work_orders` if cleaner — prefer **extend service_orders** with `room_id` + `work_kind` if RLS stays sane; otherwise dedicated table with same UX as jobs  
- Guest guide: `hotel_guides` (hotel-level) + optional `hotel_room_guides` override  
- RLS: org members full ops; guests select own reservation + guides for that hotel only  

Seed a demo hotel org with ~12 rooms, mixed statuses, 2 in-house reservations, 1 HK work order.

#### Phase 2 — Hotel ops UI

**Routing / shell**

- If `isHotelVertical && !guest`: show hotel bottom nav (Home, Rooms, Stays, Work, More).  
- Hide villa-only pages or redirect (`/villas` → `/rooms`).  
- Copy: “Properties” → “Rooms”, etc. via i18n keys under `hotel.*`.

**Create hotel profile**

- First-run empty state: wizard (name, maps, photo, defaults) → room bulk add (count + starting number + floor).  
- Quick fill parity with villas: listing URL, drive folder, PDF upload, paste notes, place lookup.

**Rooms + HK board**

- Default Rooms view = board grouped by floor.  
- Tap room → sheet: status change, assign HK, create maintenance, open stay.  
- One-tap status transitions for HK role on assigned dirty rooms.

**Stays**

- List arrivals / in-house / departures.  
- Actions: assign room, check in, check out (checkout sets room `dirty`).  
- Invite guest to reservation (reuse invite guest pattern).

**Work**

- List work orders by room; create from room sheet; staff agree/done/verify like jobs/tasks.

**Home (hotel owner/manager)**

- Action queue cards: arrivals without room, departures today, dirty count, open guest requests.  
- Each row has a primary button (Assign / Board / Open).

**Home (HK)**

- My dirty/cleaning rooms + pending agrees (mirror staff villa Home).

#### Phase 3 — Guest app (hotel)

- When `role === guest` and membership is hotel vertical: **HotelGuestHome** (not villa GuestHome).  
- Single stay card: hotel name, room #, times, Guide, Request (preset chips: towels, cleaning, issue, late checkout), Message desk, Bills.  
- Request creates work order tagged to room + notifies desk/HK.  
- Guide from `hotel_guides` (+ room override).  
- Keep guest tab set: Stay · Guide · Support · Bills.

#### Phase 4 — Invites & login

- Register/join: if invite token is for hotel org, land in hotel shell.  
- Settings: hotel profile edit for owner/manager.  
- Passkeys / email login unchanged.

#### Phase 5 — Hardening

- i18n keys for en + fall back others.  
- Busy overlay on all mutations.  
- Entitlement: company hotel uses same trial/Full gates as villa company.  
- README / FEATURE guide section for hotel audiences.  
- Do not advertise MCP hotel tools until APIs exist.

#### Implementation order (mandatory)

1. Migration + types + vertical helper  
2. Demo seed hotel  
3. Shell switch + empty hotel Home  
4. Hotel profile wizard + rooms CRUD  
5. HK board status updates  
6. Reservations check-in/out  
7. Work orders tied to rooms  
8. Guest hotel stay card + requests  
9. Polish i18n / empty states / permissions  

#### Definition of done

- [ ] New company can be created as `vertical=hotel`  
- [ ] Owner completes profile + rooms; HK logs in and updates board  
- [ ] Front desk checks in guest to a room; guest app shows room + Wi‑Fi  
- [ ] Guest request creates visible work order for staff  
- [ ] Villa demo / villa company flows on same codebase still pass smoke checks when `vertical=villas`  
- [ ] Docs: short “Hotel” section in `FEATURE_GUIDES_BY_AUDIENCE.md`  

#### Reference files (read before coding)

- `docs/DESIGN.md`, `docs/UX_SIMPLIFICATION_REVIEW.md`, this file  
- `src/lib/roles.ts`, `src/components/layout/bottom-nav.tsx`, `src/components/layout/app-shell.tsx`  
- Guest isolation: `src/lib/notifications.ts`, guest home components  
- Villa quick sources pattern: `src/components/villas/villa-quick-sources.tsx`  
- Jobs agree pattern: `src/components/jobs/agree-button.tsx`, `src/components/home/staff-home.tsx`

### PROMPT END

---

## Part C — Open product decisions (answer before or during build)

1. **One hotel per org in v1?** (Recommended: yes; chains later.)  
2. **Room status source of truth:** board-only vs also sync from reservation check-in? (Recommended: reservation check-in/out writes status; HK owns dirty→inspected.)  
3. **Work orders:** extend `service_orders` vs new table? (Recommended: new `hotel_work_orders` if villa job semantics fight room FK; else extend.)  
4. **Brand:** same “Pulse Flow” with hotel copy, or “Pulse Flow Hotels” subtitle?  
5. **Billing:** same Full SKU vs hotel-specific price later?

---

*No code was shipped in this review. Create branch `hotel` and run Part B when ready to implement.*
