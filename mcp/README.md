# @pulseflow/mcp

Agent bridge for [Pulse Flow](https://www.pulseflow.site). It only calls Pulse HTTP APIs with a personal connection key from **Settings → Connect your agent**. It never needs the database key.

You do **not** download or fork the Pulse app. `npx` fetches this package.

## Connect (owners and managers)

1. In the live app, create a connection key (`pfmcp_…`).
2. Paste the OS-specific block into your client’s `mcp.json` (Cursor: **MCP: Open User Configuration**). Prefer **Copy config** in Settings so the key is already filled in.

### Mac / Linux

Paste as-is. The long `args` string finds Node, then runs `npx -y @pulseflow/mcp`. Do not swap in a Herd or nvm path.

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
        "PULSE_MCP_TOKEN": "pfmcp_PASTE_YOUR_KEY"
      }
    }
  }
}
```

### Windows

Keep the short `npx` snippet (`/bin/bash` is not on Windows; Cursor already sees `npx`):

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

You need [Node.js](https://nodejs.org) **20+**.

## Publish (maintainers)

Scoped packages need an npm account that can publish under `@pulseflow`, with **2FA enabled** (passkey / Touch ID is fine — npm no longer requires an authenticator-app OTP).

Do **not** use `--otp=` unless you still have a legacy authenticator app. Do **not** rely on “Bypass 2FA” tokens for publish ([changelog](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/)).

```bash
cd mcp
npm login
npm run pack:check
npm publish --access public
```

When prompted, open the browser URL and confirm with fingerprint / passkey. For CI later, use [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC).

## Environment

| Variable | Required | Default |
|---|---|---|
| `PULSE_MCP_TOKEN` | yes | — |
| `PULSE_BASE_URL` | no | `https://app.pulseflow.site` |

For local app development: `"PULSE_BASE_URL": "http://localhost:3000"`.
