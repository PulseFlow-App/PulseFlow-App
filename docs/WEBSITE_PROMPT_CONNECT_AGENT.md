# Prompt for marketing site agent — “Connect your agent” landing block

Paste everything below into the marketing / website agent for **www.pulseflow.site**.

---

## Goal

Write and ship a **landing-page feature section** about Pulse’s **Connect your agent** capability, including:

1. A clear marketing paragraph (headline + short body + bullets)
2. A **preview** on the page (fake agent chat / tool-call UI) so visitors see what it feels like
3. Optional small code/config snippet (mcp.json) for people who will wire Cursor

Do **not** put this in the hero. Place it after “One language for the whole team” (or as its own section before Plans). Owners + Managers role pages get a short cross-link line; Guests page stays unchanged.

Match existing Pulse site voice: concrete, ops-first, no purple “AI magic” clichés.

---

## Product truth (use only this)

**Who:** Owners and managers only (not staff, not guests).

**How:** In the live app → **Settings → Connect your agent** → create a **connection key** (shown once) → paste into Cursor (or another MCP client). Disconnect anytime.

**Safety:** The agent never gets the database key. It only calls Pulse APIs with that personal connection key, scoped to the user’s current company workspace.

**What the agent can do today (full list — show these in the preview):**

| Capability | Agent tool name (ok in preview chrome) |
|------------|----------------------------------------|
| Who am I / which workspace | `pulse_whoami` |
| List teammates (for assignees) | `pulse_list_team` |
| List properties + status / check-in–out | `pulse_list_villas` |
| List tasks (open / pending verify / done) | `pulse_list_tasks` |
| Create a task | `pulse_create_task` |
| Update task status | `pulse_update_task_status` |
| List jobs (service orders) | `pulse_list_jobs` |
| Create a job for a teammate | `pulse_create_job` |
| List bills (pending / paid) | `pulse_list_bills` |

**Not available (do not claim):** delete properties, Stripe/billing, push blasts, guest account actions, endorsements.

---

## Copy brief (write EN first)

**Tone:** Same as the rest of the landing — short sentences, property-ops language.

**Suggested structure:**

- **Title:** Connect your agent  
- **One-liner:** Let Cursor (or another AI agent) work inside your live Pulse workspace — tasks, jobs, villas, and bills — without handing over your database.  
- **3–5 bullets** covering: connection key from Settings; read team / villas / tasks / jobs / bills; create tasks & jobs; update task status; revoke anytime.  
- **CTA line:** Available in the app under Settings → Connect your agent.

You may refine wording, but keep capability claims accurate.

---

## Preview on the website (required)

Add an interactive or animated **preview panel** that looks like a short agent session. This is mock UI for marketing — it does **not** call production APIs.

### Suggested preview script (use as the demo flow)

User asks:

> What’s open today, and create an urgent task for Mai to restock Coral before check-in.

Agent “runs” tools (show as chips or code-like lines):

1. `pulse_list_villas` → Coral · occupied · check-out tomorrow  
2. `pulse_list_team` → Mai (cleaner)  
3. `pulse_list_tasks` → 2 open  
4. `pulse_create_task` → “Restock Coral before check-in” · urgent · assigned Mai  

Agent reply:

> Coral is occupied with checkout tomorrow. I created an urgent task for Mai: Restock Coral before check-in.

Optional second beat (tap / auto-advance):

> Mark that task done when she’s finished.  
> → `pulse_update_task_status` → done

### Implementation hint for the site codebase

Use a small client component with scripted steps (typewriter or stepped reveal). Example shape you can adapt:

```tsx
const DEMO_STEPS = [
  { role: "user", text: "What’s open today, and create an urgent task for Mai to restock Coral before check-in." },
  { role: "tool", text: "pulse_list_villas → Coral · occupied · check-out tomorrow" },
  { role: "tool", text: "pulse_list_team → Mai (cleaner)" },
  { role: "tool", text: "pulse_create_task → Restock Coral before check-in · urgent · Mai" },
  { role: "agent", text: "Coral is occupied with checkout tomorrow. I created an urgent task for Mai: Restock Coral before check-in." },
];
```

Play on scroll-into-view or a “Replay” button. Keep it readable on mobile (stacked chat, not a wide IDE mock).

### Optional config teaser (collapsed)

Under the preview, a disclosure **“How to connect”** with this snippet (path placeholder OK):

```json
{
  "mcpServers": {
    "pulse": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp/src/index.ts"],
      "env": {
        "PULSE_BASE_URL": "https://app.pulseflow.site",
        "PULSE_MCP_TOKEN": "pfmcp_…"
      }
    }
  }
}
```

Note: full install steps live in the app Settings → How to connect an agent. Landing page = why + preview; app = wire-up.

---

## Design constraints

- One section, one job: explain agent connection + show preview  
- No hero takeover; no floating AI badges on hero media  
- Stay on Pulse colors (sand / primary / secondary) — avoid purple neon “AI” look  
- Title should say **Connect your agent**, not “MCP”  
- “MCP” / “Cursor” may appear once as supporting detail  

---

## Acceptance checklist

- [ ] Landing section with accurate full capability list (or demo that implies them without lying)
- [ ] Preview panel with tool-call style demo (scripted, not live API)
- [ ] Safety line: connection key, no database key, disconnect anytime
- [ ] Owners/Managers pages mention it; Guests unchanged
- [ ] Optional collapsed mcp.json teaser
- [ ] EN copy shipped; other locales don’t break keys

---

## Deliverable back to me

1. Final EN headline + paragraph + bullets  
2. Screenshot or description of the preview component  
3. Where it sits on the homepage  
