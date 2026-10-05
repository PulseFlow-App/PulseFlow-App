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

Uses `/bin/bash` with a launcher that finds a Node that also has `npx` (Homebrew, official installer, Herd, nvm, fnm, Volta, or asdf), skips Cursor’s node, and runs that `npx` by its full path. Paste as-is — do not swap in a Herd or nvm path.

```json
{
  "mcpServers": {
    "pulse": {
      "command": "/bin/bash",
      "args": [
        "-c",
        "has_npx() { [ -n \"${1:-}\" ] && [ -x \"$1\" ] && [ -x \"$(dirname \"$1\")/npx\" ]; }\nchoose() { if [ -z \"$node_bin\" ] && has_npx \"$1\"; then node_bin=\"$1\"; fi; }\npick_latest() {\n  local root=\"$1\" best=\"\" best_ver=\"\" d name ver top\n  [ -d \"$root\" ] || return 0\n  for d in \"$root\"/*; do\n    [ -x \"$d/bin/node\" ] && [ -x \"$d/bin/npx\" ] || continue\n    name=\"${d##*/}\"\n    ver=\"${name#v}\"\n    if [ -z \"$best\" ]; then best=\"$d/bin/node\"; best_ver=\"$ver\"; continue; fi\n    top=$(printf '%s\\n%s\\n' \"$best_ver\" \"$ver\" | sort -t. -k1,1n -k2,2n -k3,3n | tail -n 1)\n    if [ \"$top\" = \"$ver\" ]; then best=\"$d/bin/node\"; best_ver=\"$ver\"; fi\n  done\n  [ -n \"$best\" ] && choose \"$best\"\n}\nnode_bin=\"\"\nif command -v node >/dev/null 2>&1; then choose \"$(command -v node)\"; fi\nchoose /opt/homebrew/bin/node\nchoose /usr/local/bin/node\nchoose \"$HOME/.volta/bin/node\"\nchoose \"$HOME/.local/bin/node\"\npick_latest \"$HOME/Library/Application Support/Herd/config/nvm/versions/node\"\npick_latest \"${NVM_DIR:-$HOME/.nvm}/versions/node\"\nchoose \"$HOME/Library/Application Support/fnm/aliases/default/bin/node\"\nchoose \"$HOME/.local/share/fnm/aliases/default/bin/node\"\nchoose \"$HOME/.fnm/aliases/default/bin/node\"\nif [ -d \"$HOME/.asdf/installs/nodejs\" ]; then pick_latest \"$HOME/.asdf/installs/nodejs\"; fi\nif [ -z \"$node_bin\" ]; then echo \"Pulse MCP could not find Node.js with npx. Install Node 20 or newer, then reload this server.\" >&2; exit 1; fi\nbin_dir=$(dirname \"$node_bin\")\nexport PATH=\"$bin_dir:/usr/bin:/bin:/usr/sbin:/sbin\"\nexec \"$bin_dir/npx\" -y @pulseflow/mcp\n"
      ],
      "env": {
        "PULSE_MCP_TOKEN": "pfmcp_…"
      }
    }
  }
}
```

### Windows

Keep the short `npx` snippet. `/bin/bash` is not on Windows, and Cursor there already sees `npx`:

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

If the log says Node.js with npx could not be found, `npx: not found`, or `spawn npx ENOENT`, install Node 20+ from nodejs.org, then reload Pulse in **Cursor Settings → MCP**.

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
