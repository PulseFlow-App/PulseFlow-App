# Connect your agent to Pulse

Safer setup: the agent never gets your database key. It only calls Pulse with a **connection key** you create in the app.

## 1. Apply migration

Run `048_mcp_tokens.sql` on your Supabase project (CLI or SQL editor).

## 2. Create a connection key

1. Sign in as **owner** or **manager**
2. Open **Settings → Connect your agent**
3. Create a connection key and **copy it once** (`pfmcp_…`)

## 3. Install the agent bridge

```bash
cd mcp
npm install
```

## 4. Cursor config

Add to `~/.cursor/mcp.json` (or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "pulse": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/PulseFlow/mcp/src/index.ts"],
      "env": {
        "PULSE_BASE_URL": "https://pulseflow.site",
        "PULSE_MCP_TOKEN": "pfmcp_PASTE_TOKEN_HERE"
      }
    }
  }
}
```

For local dev, use `"PULSE_BASE_URL": "http://localhost:3000"`.

Restart Cursor → enable **pulse** in MCP settings.

## What the agent can do

| Tool | Access | Notes |
|------|--------|--------|
| `pulse_whoami` | Profile | Who this key acts as |
| `pulse_list_tasks` | Read tasks | Filter by status |
| `pulse_create_task` | Write tasks | Creates open tasks |
| `pulse_list_jobs` | Read jobs | Service orders |

## Safety

- Keys are stored **hashed**. Plaintext is shown once at create.
- Disconnect anytime in Settings.
- Key is bound to your **current workspace** and your profile.
- Only owners/managers can connect agents.
- No push, billing, or review tools in v1.
