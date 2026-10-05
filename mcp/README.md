# @pulseflow/mcp

Agent bridge for [Pulse Flow](https://www.pulseflow.site). It only calls Pulse HTTP APIs with a personal connection key from **Settings → Connect your agent**. It never needs the database key.

You do **not** download or fork the Pulse app. `npx` fetches this package.

## Connect (owners and managers)

1. In the live app, create a connection key (`pfmcp_…`).
2. Paste the OS-specific block into your client’s `mcp.json` (Cursor: **MCP: Open User Configuration**). Prefer **Copy config** in Settings so the key is already filled in.

### Mac

Paste as-is. `/bin/zsh -lc` loads your shell so `npx` is on PATH (Homebrew included).

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
        "PULSE_MCP_TOKEN": "pfmcp_PASTE_YOUR_KEY"
      }
    }
  }
}
```

### Windows

Keep the short `npx` snippet (Cursor already sees `npx`):

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
