# Prompt for marketing site agent — “Connect your agent” landing block

Paste everything below into the marketing / website agent for **www.pulseflow.site**.

---

## Goal

Write and ship a **landing-page feature section** about Pulse’s **Connect your agent** capability, including:

1. A clear marketing paragraph (headline + short body + bullets)
2. A **preview** on the page (fake agent chat / tool-call UI) so visitors see what it feels like
3. Optional small code/config snippet (mcp.json) for Cursor, Claude, or another AI agent

Do **not** put this in the hero. Place it after “One language for the whole team” (or as its own section before Plans). Owners + Managers role pages get a short cross-link line; Guests page stays unchanged.

Match existing Pulse site voice: concrete, ops-first, no purple “AI magic” clichés.

---

## Product truth (use only this)

**Who:** Owners and managers only (not staff, not guests).

**How:** In the live app → **Settings → Connect your agent** → create a **connection key** (shown once) → paste into your client: Cursor, Claude, or another AI agent. Disconnect anytime.

**Safety:** The agent never gets the database key. It only calls Pulse APIs with that personal connection key, scoped to the user’s current company workspace.

**What the agent can do today (full list — show these in the preview):**

| Capability | Agent tool name (ok in preview chrome) |
|------------|----------------------------------------|
| Who am I / which workspace | `pulse_whoami` |
| List teammates (for assignees) | `pulse_list_team` |
| List properties + status / check-in–out | `pulse_list_villas` |
| Add a property: name, photo, and location link, then the questionnaire. No web lookup. Create once | `pulse_create_villa` |
| List tasks (open / pending verify / done) | `pulse_list_tasks` |
| Create a task | `pulse_create_task` |
| Update task status | `pulse_update_task_status` |
| List jobs (service orders) | `pulse_list_jobs` |
| Create a job for a teammate | `pulse_create_job` |
| List bills (pending / paid) | `pulse_list_bills` |
| Read guest house instructions | `pulse_get_property_instructions` |
| Set guest house instructions | `pulse_set_property_instructions` |
| Assign a cleaner or staff member to a property | `pulse_assign_property` |

**Not available (do not claim):** delete properties, Stripe/billing, push blasts, guest account actions, endorsements.

---

## Copy brief (write EN first)

**Tone:** Same as the rest of the landing — short sentences, property-ops language.

**Suggested structure:**

- **Title:** Connect your agent  
- **One-liner:** Let Cursor, Claude, or another AI agent work inside your live Pulse workspace — tasks, jobs, villas, and bills — without handing over your database.  
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

### How to connect (required, under the preview)

Match the live app Settings guide. No clone, ZIP, absolute path, or `cd mcp` steps — `npx` fetches `@pulseflow/mcp`.

**Section title:** Connect your agent  

**Hint under the title:** Let Cursor, Claude (or another AI agent) read and update tasks and jobs in this workspace. Create a connection key, then paste it into your agent app.

**Config block title:** Copy this MCP config  

**Config hint:** This block is the whole connection. Create a key above first, then press Copy config so your key is already inside. You do not download Pulse — npx fetches the agent bridge.

Show **two OS tabs** (default to visitor OS if known): Mac / Linux and Windows.

**Mac / Linux block** (key filled after they create one in the app; marketing can use `pfmcp_…`). Paste as-is. The long string finds Node, then runs `npx -y @pulseflow/mcp`. Do not swap in a Herd or nvm path.

```json
{
  "mcpServers": {
    "pulse": {
      "command": "/bin/bash",
      "args": [
        "-c",
        "pick() { local root=\"$1\" best=\"\" best_ver=\"\" d name ver top; [ -d \"$root\" ] || return 1; for d in \"$root\"/*; do [ -x \"$d/bin/node\" ] || continue; name=\"${d##*/}\"; ver=\"${name#v}\"; if [ -z \"$best\" ]; then best=\"$d/bin/node\"; best_ver=\"$ver\"; continue; fi; top=\"$(printf '%s\\n%s\\n' \"$best_ver\" \"$ver\" | sort -t. -k1,1n -k2,2n -k3,3n | tail -n 1)\"; if [ \"$top\" = \"$ver\" ]; then best=\"$d/bin/node\"; best_ver=\"$ver\"; fi; done; [ -n \"$best\" ] || return 1; printf '%s\\n' \"$best\"; }; node_bin=\"\"; if command -v node >/dev/null 2>&1; then node_bin=\"$(command -v node)\"; fi; if [ -z \"$node_bin\" ]; then for c in /opt/homebrew/bin/node /usr/local/bin/node \"$HOME/.volta/bin/node\" \"$HOME/.local/bin/node\"; do if [ -x \"$c\" ]; then node_bin=\"$c\"; break; fi; done; fi; if [ -z \"$node_bin\" ]; then node_bin=\"$(pick \"$HOME/Library/Application Support/Herd/config/nvm/versions/node\" || true)\"; fi; if [ -z \"$node_bin\" ]; then node_bin=\"$(pick \"${NVM_DIR:-$HOME/.nvm}/versions/node\" || true)\"; fi; if [ -z \"$node_bin\" ]; then for c in \"$HOME/Library/Application Support/fnm/aliases/default/bin/node\" \"$HOME/.local/share/fnm/aliases/default/bin/node\" \"$HOME/.fnm/aliases/default/bin/node\"; do if [ -x \"$c\" ]; then node_bin=\"$c\"; break; fi; done; fi; if [ -z \"$node_bin\" ] && [ -d \"$HOME/.asdf/installs/nodejs\" ]; then node_bin=\"$(pick \"$HOME/.asdf/installs/nodejs\" || true)\"; fi; if [ -z \"$node_bin\" ]; then echo \"Pulse MCP could not find Node.js. Install Node 20 or newer, then reload this server.\" >&2; exit 1; fi; export PATH=\"$(dirname \"$node_bin\"):/usr/bin:/bin:/usr/sbin:/sbin\"; exec npx -y @pulseflow/mcp"
      ],
      "env": {
        "PULSE_MCP_TOKEN": "pfmcp_…"
      }
    }
  }
}
```

**Windows block** (keep short `npx` — `/bin/bash` is not on Windows; Cursor already sees `npx`):

```json
{
  "mcpServers": {
    "pulse": {
      "command": "npx",
      "args": ["-y", "@pulseflow/mcp"],
      "env": {
        "PULSE_MCP_TOKEN": "pfmcp_…"
      }
    }
  }
}
```

**Where to paste it** (steps only — no intro sentence, no Terminal install block):

1. Open your client's MCP config and paste the block. Cursor: Cmd+Shift+P on Mac or Ctrl+Shift+P on Windows, then MCP: Open User Configuration (`~/.cursor/mcp.json`). Claude Desktop: `claude_desktop_config.json`. Another AI agent: that app's `mcp.json`. If other servers are already listed, paste only the `pulse` entry inside `mcpServers`.
2. Paste the block as it is for your OS tab. Do not replace paths and do not clone Pulse. You need Node.js 20+ (nodejs.org).
3. Save the file. Turn the pulse server on in your client (in Cursor: Settings → MCP). It should list Pulse tools.
4. Open a new chat in your client. In Cursor, set the mode to Agent, not Ask. Ask: Who am I in Pulse, and list my villas.

**Footer note:** If pulse stays off and the log says Node.js could not be found or spawn npx ENOENT, install Node 20+ from nodejs.org, then reload the server / restart the client.

**What it can do:** pulse_whoami, pulse_list_team, pulse_list_villas, pulse_create_villa, pulse_list_tasks, pulse_create_task, pulse_update_task_status, pulse_list_jobs, pulse_create_job, pulse_list_bills, pulse_get_property_instructions, pulse_set_property_instructions, pulse_assign_property.

---

## Design constraints

- One section, one job: explain agent connection + show preview  
- No hero takeover; no floating AI badges on hero media  
- Stay on Pulse colors (sand / primary / secondary) — avoid purple neon “AI” look  
- Title should say **Connect your agent**, not “MCP”  
- “MCP” may appear as supporting detail. Name the client as Cursor, Claude, or another AI agent — not Cursor alone.  

---

## Acceptance checklist

- [ ] Landing section with accurate full capability list (or demo that implies them without lying)
- [ ] Preview panel with tool-call style demo (scripted, not live API)
- [ ] Safety line: connection key, no database key, disconnect anytime
- [ ] Owners/Managers pages mention it; Guests unchanged
- [ ] Visible MCP config block with a copy button, plus steps for Cursor, Claude, or another AI agent
- [ ] EN copy shipped; other locales don’t break keys

---

## Deliverable back to me

1. Final EN headline + paragraph + bullets  
2. Screenshot or description of the preview component  
3. Where it sits on the homepage  
