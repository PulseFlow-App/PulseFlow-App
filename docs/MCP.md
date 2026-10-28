# Connect your agent to Pulse

Safer setup: the agent never gets your database key. It only calls Pulse with a **connection key** you create in the app.

Users do **not** download or fork the Pulse app. `npx @pulseflow/mcp` fetches the public agent bridge from npm.

## 1. Apply migrations

Run `048_mcp_tokens.sql` on your Supabase project (CLI or SQL editor).

For team master info tools, also apply `053_master_info_allow_manager.sql` (or `scripts/apply-053-master-info.sql`). Without it, note fields can still save from the app (fallback), but `allow_manager_view` and some MCP selects need the column.

### Local Connect agent (before npm 0.3.0 is published)

Published `@pulseflow/mcp` is still `0.2.0` on npm (no master-info tools). Until `0.3.0` is published, point Cursor MCP at the repo build:

```json
{
  "mcpServers": {
    "pulse": {
      "command": "/ABS/PATH/TO/node",
      "args": [
        "/ABS/PATH/TO/PulseFlow (villas management)/mcp/bin/pulse-mcp.js"
      ],
      "env": {
        "PULSE_MCP_TOKEN": "pfmcp_…",
        "PULSE_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

Reload MCP in Cursor (Settings → MCP → pulse refresh). `PULSE_BASE_URL` must serve the app that includes `/api/mcp/villas/:id/master-info`. After reload you should see `pulse_get_master_info` / `pulse_set_master_info`.

## 2. Create a connection key

1. Sign in as **owner** or **manager**
2. Open **Settings → Connect your agent**
3. Create a connection key and **copy it once** (`pfmcp_…`)

Legacy keys minted with the original default scopes automatically unlock the new tools below.

## 3. Agent client config

In the app, **Settings → Connect your agent** shows the config block (Mac / Linux vs Windows tabs). Create a key, then press **Copy config** so the key is already inside. Paste that block as it is.

You need [Node.js](https://nodejs.org) **20+** so `npx` can run.

1. Open that client's MCP config. Cursor: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows) → **MCP: Open User Configuration** (`~/.cursor/mcp.json`). Claude Desktop: `claude_desktop_config.json`. Another agent: that app's `mcp.json`.
2. Paste the block for your OS.
3. Save. Turn **pulse** on (in Cursor: **Settings → MCP**).
4. Open a new chat. In Cursor, use **Agent**, not Ask. Ask: “Who am I in Pulse, and list my villas.”

### Mac

Uses `/bin/zsh -lc` so your shell PATH (including Homebrew) is loaded, then `npx -y @pulseflow/mcp`. Paste as-is.

```json
{
  "mcpServers": {
    "pulse": {
      "command": "/bin/zsh",
      "args": [
        "-lc",
        "source \"$HOME/.zshrc\" >/dev/null 2>&1; export PATH=\"/opt/homebrew/bin:/usr/local/bin:$PATH\"; exec npx -y @pulseflow/mcp"
      ],
      "env": {
        "PULSE_MCP_TOKEN": "pfmcp_…"
      }
    }
  }
}
```

### Windows

Keep the short `npx` snippet. Cursor on Windows already sees `npx`:

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

`PULSE_BASE_URL` defaults to `https://app.pulseflow.site`. For local app development add `"PULSE_BASE_URL": "http://localhost:3000"`.

If the log says `npx: not found` or `spawn npx ENOENT`, install Node 20+ from nodejs.org, then reload Pulse in **Cursor Settings → MCP**.

## What the agent can do

| Tool | Scope | Notes |
|------|--------|--------|
| `pulse_whoami` | `me:read` | Who this key acts as |
| `pulse_list_team` | `team:read` | Teammates for assignees |
| `pulse_list_villas` | `villas:read` | Properties + status / dates |
| `pulse_create_villa` | `villas:write` | Add a property once. Ask name, photo, and location link first, then bedrooms, bathrooms, size, guests, air conditioning, parking, view, and optional extras. Leave an unmarked extra unset. Keep a size range as a range. Do not search the internet. A listing cannot be edited after it is created. |
| `pulse_list_tasks` | `tasks:read` | Filter by status |
| `pulse_create_task` | `tasks:write` | Create open tasks |
| `pulse_update_task_status` | `tasks:write` | `open` / `pending_verify` / `done` |
| `pulse_list_jobs` | `jobs:read` | Service orders |
| `pulse_create_job` | `jobs:write` | Book teammate + task + request chat |
| `pulse_list_bills` | `bills:read` | Pending / paid bills |
| `pulse_get_property_instructions` | `villas:read` | **Guest house guide only** (Wi-Fi, gate, bins…). Not master info. |
| `pulse_set_property_instructions` | `villas:write` | Set guest house guide. Guests see it. Do **not** put utilities/handoff here. |
| `pulse_get_master_info` | `villas:read` | **Team master info only** (utilities, providers, access, contacts, tax, handoff) |
| `pulse_set_master_info` | `villas:write` | Set team master info. Separate from the guest house guide. |
| `pulse_list_maintenance` | `villas:read` | Maintenance log for a property |
| `pulse_add_maintenance` | `villas:write` | Add a maintenance log entry |
| `pulse_assign_property` | `villas:write` | Assign a cleaner or staff teammate to a property. Other assignees stay. |

## Safety

- Keys are stored **hashed**. Plaintext is shown once at create.
- Disconnect anytime in Settings.
- Key is bound to your **current workspace** and your profile.
- Only owners/managers can connect agents.
- No Stripe, push blast, or delete-villa tools.
