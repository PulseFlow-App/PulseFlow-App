# Connect your agent to Pulse

Safer setup: the agent never gets your database key. It only calls Pulse with a **connection key** you create in the app.

Users do **not** download or fork the Pulse app. `npx @pulseflow/mcp` fetches the public agent bridge from npm.

## 1. Apply migration

Run `048_mcp_tokens.sql` on your Supabase project (CLI or SQL editor).

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
| `pulse_create_villa` | `villas:write` | Add a property from a name, attached photos, a voice note, or written details. Look up a maps link only for what the user did not already give. |
| `pulse_list_tasks` | `tasks:read` | Filter by status |
| `pulse_create_task` | `tasks:write` | Create open tasks |
| `pulse_update_task_status` | `tasks:write` | `open` / `pending_verify` / `done` |
| `pulse_list_jobs` | `jobs:read` | Service orders |
| `pulse_create_job` | `jobs:write` | Book teammate + task + request chat |
| `pulse_list_bills` | `bills:read` | Pending / paid bills |

## Safety

- Keys are stored **hashed**. Plaintext is shown once at create.
- Disconnect anytime in Settings.
- Key is bound to your **current workspace** and your profile.
- Only owners/managers can connect agents.
- No Stripe, push blast, or delete-villa tools.
