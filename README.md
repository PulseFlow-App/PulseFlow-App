# Pulse Flow

**The pulse of your rental operations.** A phone-first app where owners, managers, field staff, and guests share one live picture of properties, jobs, money, and stays.

App: [app.pulseflow.site](https://app.pulseflow.site) · Guides by role: [`docs/FEATURE_GUIDES_BY_AUDIENCE.md`](docs/FEATURE_GUIDES_BY_AUDIENCE.md)

---

## Who it’s for

| You are… | You use Pulse Flow to… |
|----------|------------------------|
| **Owner** (company) | Run the ops workspace: villas, team, guests, reports, and billing |
| **Manager** | Day-to-day ops like an owner (without owning the company bill) |
| **Field staff** | See today’s jobs, agree/complete work, submit receipts, build reputation |
| **Guest** | House guide, host support, deposit/bills, request next stay dates |
| **Personal** | Solo villas and light ops — free, no team features |

---

## Getting started

1. **Open the app** on your phone or desktop: [app.pulseflow.site](https://app.pulseflow.site).
2. **Create an account** (or accept an invite link from your host/employer).
3. On signup, pick **Personal** (solo) or **Company** (team + guests).
4. Optional: **Settings → Face ID / passkey** for faster sign-in, and **Phone alerts** after adding the app to your Home Screen (iPhone: Share → Add to Home Screen).

**Language & display currency:** Settings.

---

## How to use it (by role)

### Owner / manager (company)

| Do this | Where |
|---------|--------|
| See occupancy, urgent work, spend | **Home** |
| Add/edit properties, photos, check-in/out, house guide (Wi‑Fi, gate, checkout) | **Properties** |
| Create and assign work | **Tasks** |
| Book cleaners/vendors; track agree → complete | **Jobs** |
| Vendor phone book; Call / WhatsApp / LINE; in-app Order | **Contacts** |
| Receipts and mark paid | **Bills** |
| Team thread (not guest support) | **Messages** |
| Confirmed stays, deposits, briefings | **Guests** |
| Accept/decline guest date requests & send price quotes | **Date requests** (menu) |
| Month grid + Airbnb / Booking.com calendar import | **Bookings calendar** (menu); paste Export calendar URL on each **Property** → Sync |
| Download a job (or this week) to Google / Apple Calendar | **Jobs** → Add to calendar |
| CSV exports, weekly summary, handoffs | **Reports & handoffs** (menu) — needs active trial/Full |
| Find opted-in field talent | **Staff search** (menu) |
| Invite staff, managers, guests | **Invites** / Settings flip cards |
| Assign which villas each field person sees | **Company** (owner) |
| Billing / trial / referral year | **Settings → Plan** (owner) |
| Connect Cursor/Claude agent for villa & task ops | **Settings → Connect agent** |

**Guest booking loop:** Guest requests dates → you send a **price quote** (and optional deposit) → guest **Accept price & confirm stay** → stay + villa dates update → guest gets house guide and Support.

### Field staff

| Do this | Where |
|---------|--------|
| Today’s work first | **Home** |
| Read & agree, then complete jobs | **Jobs** |
| Only assigned properties | **Properties** |
| Team chat | **Messages** |
| Submit your own receipts | **Bills** |
| Opt into skills / bio / map for hire | **Settings → Talent profile** |
| Stars & public profile | **Endorsements** / **Leaderboard** (menu) |

### Guest

Footer tabs only:

| Tab | What you do |
|-----|-------------|
| **Stay** | Confirmed stay, host notices, house guide, briefings (mark as read), arrival/departure photos |
| **Villas** | Browse host properties → **Request dates & price** → accept the host’s quote when it arrives |
| **Support** | Message owner/manager only (after a confirmed stay). Use `/deposit` when you’ve paid a deposit; `/cancel` if canceling in time |
| **Bills** | Security deposit, deductions, balance |

### Personal (solo)

Villas, tasks, your bills, and a simple contacts list. No team chat, staff invites, guest panel, or company reports. Invite friends with your referral link (Settings) — 5 joins can unlock a year of company Full when you grow into a team.

---

## Everyday tips

- **Install as an app** for a fuller phone experience and push alerts.
- **Notifications** (bell) cover check-ins, tasks, chat, bills, and stay updates — kinds depend on your role.
- **Reports** appear in the menu for company owners/managers only while trial or Full is active.
- **Agent (Messages → Agent)** lets owners/managers run slash commands (e.g. tasks, villas) from the phone when enabled.
- Guests never land in the cleaning crew chat — Support is host-only.

---

## Plans (short)

- **Personal** — free forever, solo.
- **Company** — trial, then owner subscribes for Full (team, guests, reports, talent, etc.). Details: [`docs/COMPANY_FEATURES.md`](docs/COMPANY_FEATURES.md).

---

## For developers

Local demo, Supabase, App Store billing notes, and deploy notes live in [`docs/PRODUCTION.md`](docs/PRODUCTION.md). Agent / MCP setup: [`docs/MCP.md`](docs/MCP.md).

```bash
npm install
npm run dev
```

Demo mode works without Supabase. Open [http://localhost:3000](http://localhost:3000).
