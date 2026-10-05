# @pulseflow/mcp

Agent bridge for [Pulse Flow](https://www.pulseflow.site). It only calls Pulse HTTP APIs with a personal connection key from **Settings → Connect your agent**. It never needs the database key.

You do **not** download or fork the Pulse app. `npx` fetches this package.

## Connect (owners and managers)

1. In the live app, create a connection key (`pfmcp_…`).
2. Paste this into your client’s `mcp.json` (Cursor: **MCP: Open User Configuration**):

```json
{
  "mcpServers": {
    "pulse": {
      "command": "npx",
      "args": ["-y", "@pulseflow/mcp"],
      "env": {
        "PULSE_MCP_TOKEN": "pfmcp_PASTE_YOUR_KEY"
      }
    }
  }
}
```

3. Turn **pulse** on. In Cursor, use **Agent** mode and ask: “Who am I in Pulse, and list my villas.”

You need [Node.js](https://nodejs.org) 18+ so `npx` exists.

## Environment

| Variable | Required | Default |
|---|---|---|
| `PULSE_MCP_TOKEN` | yes | — |
| `PULSE_BASE_URL` | no | `https://app.pulseflow.site` |

For local app development: `"PULSE_BASE_URL": "http://localhost:3000"`.
