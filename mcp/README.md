# @pulseflow/mcp

Agent bridge for [Pulse Flow](https://www.pulseflow.site). It only calls Pulse HTTP APIs with a personal connection key from **Settings → Connect your agent**. It never needs the database key.

You do **not** download or fork the Pulse app. `npx` fetches this package.

## Connect (owners and managers)

1. In the live app, create a connection key (`pfmcp_…`).
2. Paste the OS-specific block into your client’s `mcp.json` (Cursor: **MCP: Open User Configuration**). Prefer **Copy config** in Settings so the key is already filled in.

### Mac / Linux

Paste as-is. The long `args` string finds a Node that also has `npx`, then runs that `npx` by its full path. Cursor’s node is skipped. Do not swap in a Herd or nvm path.

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
