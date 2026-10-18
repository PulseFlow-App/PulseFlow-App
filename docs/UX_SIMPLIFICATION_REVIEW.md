# UX simplification review — fewer steps, more effect per tap

**Status:** Draft for product review (not a build plan)  
**Date:** 2026-10-17  
**Scope:** Pulse Flow app (`src/app/(app)` + shared components), all roles  
**Goal:** Cut chase time. Every tap should either finish work or open the one screen that finishes it.

---

## 1. North star

**Maximize effect per tap.** Prefer:

1. **Do it here** (inline on Home / list) over navigate → form → save → back  
2. **Smart defaults** over empty forms  
3. **One destination for one job** over parallel pages that mean the same thing  
4. **Capture once, reuse everywhere** (listing paste → property; order → task + chat)

If a step does not change state, assign work, confirm money, or unblock someone — cut it.

---

## 2. Role tap budgets (what “fast” means)

| Role | Daily high-value actions | Target after simplification |
|------|--------------------------|-----------------------------|
| **Owner / manager** | Book turnover / repair, glance occupancy, clear urgent tasks, answer guest quote | Most ops actions ≤ **2 taps** from Home or list |
| **Staff** | Agree today’s jobs, mark done / verify, drop a receipt | Agree / done / receipt ≤ **1–2 taps** |
| **Guest** | Wi‑Fi, ask host, pay deposit, request dates | Guide + support always **1 tap**; money/dates ≤ **3** |

Current app is already strong on **staff agree-from-Home** and **task checkbox-done**. Biggest waste is **owner booking + property setup + guest money loops** and **navigation to find the right tool**.

---

## 3. Current friction map (where taps die)

### 3.1 Book work (owner) — highest ROI to simplify

**Today (rough):** Contacts → find person → Order → fill when/where/what → Send → (staff) Home/Jobs → Read & agreed → later Mark done.

| Step | Needed? | Note |
|------|---------|------|
| Open Contacts | Often yes | Or should start from villa / Home |
| Find contact | Yes | Search/recents help |
| Order form | Yes but heavy | Schedule modes add power and length |
| Staff agree | Yes | Already 1 tap on Home — keep |
| Separate Tasks vs Jobs mental model | No | Same work, two names |

**Proposal — “Order from the villa” (2 taps):**  
On villa card / detail: **Book cleaning** / **Book repair** → pick contact (or last used) → send with defaults (today, that villa, visit times from last order). Skip re-entering where.

**Proposal — “Turnover chip” on Home:**  
When status is turnover: one chip **Book turnover** → last cleaner + default window → confirm sheet → send.

### 3.2 Create task (owner/manager)

**Today:** Tasks → Add → title, villa, priority, day, timing mode, assignee, notes, photo → Create.

Powerful, but everyday tasks don’t need the full schedule UI every time.

**Simplify:**

| Idea | Effect |
|------|--------|
| **Quick add bar** on Tasks (and Home): title + Enter creates open task (villa = last / none) | 1 tap + type |
| Collapse Timing behind **“Schedule”** (closed by default) | Fewer fields in the default path |
| Prefill assignee = villa’s usual assignee | Saves a picker |
| From villa page: **Add task here** with villa locked | No villa step |

### 3.3 Add / enrich property

**Today:** FAB → long form (name, area, maps required, quick fill, details, photo) → Save.  
Maps URL is required even when Quick fill place search just ran (good) — but still blocks “name only, finish later.”

**Simplify:**

| Idea | Effect |
|------|--------|
| **Minimal create:** name (+ optional listing/paste) → Save; maps optional until first job booked | Faster inventory capture |
| After listing paste / doc upload: **“Apply facts”** button that suggests beds/guests from text (later AI) | One paste → many fields |
| Don’t open full details accordion by default | Shorter first screen |
| Stay on villa after Save (don’t bounce to list) | Edit master info / guide without re-finding villa |

### 3.4 Villa detail is a “settings dump”

One scroll hosts: photo, core fields, quick sources, details, assignees, house guide, master info, maintenance, jobs/tasks, delete.

**Simplify information architecture:**

- **Today tab:** status, dates, cleaning, assignees, open jobs/tasks, primary CTAs (Book / Add task)  
- **Guide tab:** guest-facing house guide  
- **Ops file tab:** master info + maintenance + docs/listing links  

Same page, 3 segments — less endless scroll, clearer jobs.

### 3.5 Tasks vs Jobs vs Contacts Order

Three doors to “someone should do something at a property.”

| Surface | Who | What |
|---------|-----|------|
| Tasks | Owner (staff redirected to Jobs) | Internal work |
| Jobs | Staff (+ owner bookings view) | Ack’d service orders |
| Contacts → Order | Owner | Creates order (+ task) |

**Simplify messaging (product, not only UI):**

- Owner bottom nav: keep **Tasks** as the single “Work” hub: tabs **Open / Bookings / Done**  
- Staff keep **Jobs** as the word they know  
- Contacts Order becomes **“Book”** inside Work + villa, not a scavenger hunt

### 3.6 Owner Home is low action density

Home shows pulse (stats, chart, urgent list). Staff Home is an **action queue** (agree jobs). Owner Home should steal that pattern.

**Add owner action queue (same pattern as staff):**

1. Guest quotes waiting  
2. Tasks pending verify  
3. Turnovers tomorrow without a booked clean  
4. Bills to approve (if that exists in flow)

Each row: primary button on the card (Approve / Book / Open), not only a link deeper.

### 3.7 Guest stay loop

**Today:** browse → request dates → wait → quote → accept → deposit → confirm stay; support via Messages; guide on Villas.

Already better than WhatsApp, but hops span Guests / date-requests / Messages / Bills.

**Simplify:**

| Idea | Effect |
|------|--------|
| Guest Home = **single stay card** with stacked CTAs: Guide · Message host · Pay deposit · Request dates | 1 place |
| Quote accept + deposit next step on the same card | Fewer page switches |
| Deep links from push always land on that stay card with the right sheet open | 1 tap from notification |

### 3.8 Chat / Agent

Agent can create villas/tasks/jobs — high leverage, low discoverability (type `/`).

**Simplify:**

- Persistent **chip row** above composer: `Add property` `New task` `Book job` `Help` (not only after typing `/`)  
- From empty Tasks / Villas: **“Or ask the agent”** one-liner with deep link to Messages + prefilled `/villa` or `/task`  
- Don’t force questionnaire if Quick fill already exists in form — agent should accept “listing URL” as first answer and stop asking duplicate questions

### 3.9 Navigation & menu sprawl

| Issue | Simplify |
|-------|----------|
| Owner Messages only via header icon | Keep, but make badge louder; optional 5th tab swap Bills ↔ Chat by usage |
| Date requests separate from Guests | Merge: Guests page tabs **Stays · Requests** |
| Endorsements + Leaderboard | One **Reputation** page with two sections |
| Talent + Invites + Company buried in burger | Keep secondary, but add **Invite** and **Find staff** to Contacts header actions |
| Reports | Keep in menu; add **Export week** from Home overflow for managers |

### 3.10 Confirms & redirects that cost a tap

| Pattern | Change |
|---------|--------|
| `window.confirm` delete task | Soft delete / undo toast (5s) for tasks; hard confirm only for villa delete |
| Save villa → `router.push("/villas")` | Stay on villa; toast “Saved” |
| Create task → collapses form | Keep, but show the new row highlighted at top |
| Review-after-done banner | Keep — excellent tap leverage |

### 3.11 Forms that ask everything up front

Schedule (window vs visits vs recurrence), villa details enums, master info — all valuable, all optional-feeling until needed.

**Rule:** progressive disclosure.

- Default path = 20% of fields  
- “More timing” / “More details” / “Ops handoff” expanders  
- Remember last-used schedule mode per user

---

## 4. “Max effect per tap” patterns to standardize

Copy these patterns everywhere they fit (staff Home already does #1–2):

1. **Inline primary action on the list row** (Agree, Mark done, Pay, Approve quote)  
2. **Contextual create** (villa locked, contact locked, today prefilled)  
3. **Last-used defaults** (last cleaner, last visit times, last area)  
4. **Undo instead of confirm** for reversible deletes  
5. **Sheet over full page** for short flows (book job, quick task, approve quote)  
6. **Notification → exact sheet** (not generic inbox)  
7. **One Work hub** for owners (tasks + bookings)  
8. **Capture links/docs once** on property (already started with Quick fill)

---

## 5. Prioritized backlog for review

### P0 — biggest time wins (ship next)

| # | Change | Who wins | Why |
|---|--------|----------|-----|
| P0.1 | **Book from villa** (and turnover chip on Home) with last-contact defaults | Owner | Cuts Contacts scavenger hunt |
| P0.2 | **Owner Home action queue** (verify / quotes / unbooked turnovers) | Owner | Home becomes do-work, not only glance |
| P0.3 | **Quick task bar** + schedule collapsed by default | Owner/manager | Everyday task in seconds |
| P0.4 | **Guest Home stay card** as single hub for guide / pay / dates / message | Guest | Stops cross-tab hunting |
| P0.5 | **Save villa stays on villa** + toast | Owner | Stops list round-trips |

### P1 — clear simplification, medium build

| # | Change | Who wins |
|---|--------|----------|
| P1.1 | Villa detail **Today / Guide / Ops file** segments | Owner/staff |
| P1.2 | Guests + date-requests **merged** | Owner |
| P1.3 | Owner Work hub: Tasks page tabs include **Bookings** | Owner |
| P1.4 | Agent **command chips** always visible in Messages | All ops |
| P1.5 | Soft-delete tasks with undo | Owner |
| P1.6 | Minimal property create (maps not required on first save) | Owner |

### P2 — polish / later leverage

| # | Change |
|---|--------|
| P2.1 | Parse pasted listing / PDF into suggested beds/guests (assistive, editable) |
| P2.2 | Reputation = endorsements + leaderboard one page |
| P2.3 | Contacts header: Invite · Find staff |
| P2.4 | Prefill `/job` from villa + contact deep links |
| P2.5 | Per-user “default visit times” in Settings (e.g. 09:00 & 18:00) |

---

## 6. What not to simplify away

Keep these even if they cost a tap — they prevent expensive mistakes:

- **Read & agreed** on jobs (liability / expectation lock)  
- **Verify** path for staff completion when owner wants photo proof  
- **Hard confirm** on villa delete and account delete  
- **Guest isolation** (never dump guests into team chat)  
- **Busy / stay-on-page** feedback during saves (already improved)

---

## 7. Suggested review questions

1. For owners, is the #1 daily action **booking cleans** or **checking occupancy**? (Drives whether Home queue or villa Book ships first.)  
2. Are we OK making **maps link optional** on first property save?  
3. Should **Tasks** absorb owner **Jobs/Bookings**, or stay separate forever?  
4. Guest: is **one Stay card** on Home the product, with Villas tab only for browsing next stays?  
5. How aggressive on **undo vs confirm** for task delete?

---

## 8. Success metrics (if we instrument)

| Metric | Direction |
|--------|-----------|
| Median taps from app open → job booked | ↓ |
| Median taps from app open → task created | ↓ |
| % of jobs booked from villa/Home vs Contacts | ↑ villa/Home |
| % guest deposit paid without opening >1 other tab | ↑ |
| Time on villa detail before first Save | ↓ |
| Staff: % of agrees completed from Home (not Jobs page) | ↑ or hold high |

---

## 9. One-line summary for stakeholders

**Stop making people hunt for the right page.** Put the next decision on Home and on the villa, collapse advanced fields, reuse last choices, and treat Contacts Order / Tasks / Jobs as one Work system with role-appropriate words.

---

*This doc is for review and prioritization. No code changes are implied until items are pulled into a sprint.*
