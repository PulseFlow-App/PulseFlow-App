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

### Mac / Linux

Uses `/bin/bash` with a launcher that finds Node (Homebrew, official installer, Herd, nvm, fnm, Volta, or asdf), then runs `npx -y @pulseflow/mcp`. Paste as-is — do not swap in a Herd or nvm path.

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

### Windows

Cursor on Windows already sees `npx`. Keep the short snippet (`/bin/bash` is not used):

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

If the log says Node could not be found or `spawn npx ENOENT`, install Node 20+, then reload the server / restart the client.

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
