# PulseFlow

**The pulse of your operation.** Mobile-first PWA for Koh Phangan villa ops - owners and on-site managers sharing one live dataset.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth, Postgres + RLS, Realtime, Storage)
- Zod + React Hook Form, Lucide, Recharts
- Installable PWA (`manifest.webmanifest` + `sw.js`)

## Quick start (demo mode)

Demo mode is on by default so you can use the full UI without a Supabase project.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Sign in (seeded):**

| Role     | Email                      | Password       |
|----------|----------------------------|----------------|
| Owner    | `owner@pulseflow.site`     | `TestPass123!` |
| Manager  | `manager@pulseflow.site`   | `TestPass123!` |
| Employee | `employee@pulseflow.site`  | `TestPass123!` |

**Or register** at `/register`: pick Personal vs Company, then Owner vs Employee/manager, then create your org/workspace.

**Invites:** Owner or Manager opens Settings → Invite teammate (unique `/join/[token]` link; invitee only sets a password). Managers cannot invite owners.

## Connect Supabase

1. Create a Supabase project.
2. Run [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql) in the SQL editor.
3. Copy `.env.example` → `.env.local` and set:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

4. Seed users + sample villas/contacts/tasks:

```bash
npm run seed
```

## App map

- **Home** - greeting hero, villa status tiles, urgent tasks, check-in/out strip, weekly ops chart
- **Villas / Tasks / Contacts / Bills** - full CRUD (role-gated where required)
- **Messages** - header icon, realtime org chat
- **Settings** - profile, invite link (owner), sign out

Bottom nav: Home · Villas · Tasks · Contacts · Bills

## Deploy

Deploy to Vercel, set env vars, point `pulseflow.site` at the project. After deploy, use Lighthouse PWA audit and “Add to Home Screen” on iOS Safari / Android Chrome.
