# Deploy reward_vault

Quick steps to build and deploy the program, then wire it up for the app.

## Prerequisites

- **Rust** (1.75+): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Solana CLI**: use the **official installer** (Homebrew often lacks `cargo-build-sbf`). See "Fix: anchor build fails with build-sbf" below.
- **Anchor 0.30.x**: `cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli`

Ensure `solana`, `cargo`, and `anchor` are on your `PATH`.

### Fix: `anchor build` fails with "no such command: build-sbf"

The [solana-labs/solana](https://github.com/solana-labs/solana) repo was archived (read-only) in Jan 2025; **releases are still available** for download.

1. **Install Solana** (pick one):
   - **Option A (script):**
     ```bash
     sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
     ```
   - **Option B (if Option A fails with SSL):** Download a tarball from [GitHub Releases](https://github.com/solana-labs/solana/releases) (e.g. `solana-release-aarch64-apple-darwin.tar.bz2` for Apple Silicon), extract it, then add the extracted `bin` folder to your `PATH`.
   - **Option C (alternative installer):**
     ```bash
     curl -sSfL https://solana-install.solana.workers.dev | sh
     ```

2. **Confirm the binary exists:**
   ```bash
   ls "$HOME/.local/share/solana/install/active_release/bin/cargo-build-sbf"
   ```
   If that path doesn’t exist, the installer didn’t run or used a different prefix; use the path the installer printed.

3. **Put Solana’s bin before Cargo’s bin** (so `cargo` sees `cargo-build-sbf`):
   ```bash
   export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
   which cargo-build-sbf   # should print a path
   cargo --list            # should include build-sbf
   ```

4. **Then build:**
   ```bash
   cd contracts/rewards-solana
   anchor build
   ```
   Add the `export PATH=...` line to your `~/.zshrc` (or `~/.bashrc`) so it persists.

---

## 1. Build

```bash
cd contracts/rewards-solana
anchor build
```

On first build, Anchor creates `target/deploy/reward_vault-keypair.json` and updates the program ID in the code. **Save the program ID** (it’s in the build output or run `anchor keys list`).

---

## 2. Set cluster and wallet

- **Anchor.toml** already has `cluster = "devnet"` and `wallet = "~/.config/solana/id.json"`.
- Ensure that wallet exists: `solana keygen new` (or use an existing keypair path in `Anchor.toml`).
- For **devnet**: get SOL: `solana airdrop 2 --url devnet`
- For **mainnet**: use `cluster = "mainnet-beta"` and fund the wallet with SOL.

---

## 3. Deploy

**Devnet:**

```bash
anchor deploy --provider.cluster devnet
```

**Mainnet:**

```bash
anchor deploy --provider.cluster mainnet
```

Note the **program ID** printed after deploy (same as in `declare_id!(...)` and `Anchor.toml`).

---

## 4. After deploy: initialize vault

Run **once** per token (e.g. once for $PULSE):

1. **Initialize** the vault (owner + mint)  - see main [README](./README.md) “Call initialize” for the exact accounts and a TS example.
2. **Set redemption rate**: `set_redemption_rate(points_per_token)` (e.g. `100` = 100 points per 1 token).
3. **Enable daily check-in**: `init_daily_config(daily_check_in_points, cooldown_secs)` (e.g. `30`, `86400`).
4. **Deposit** tokens into the vault: `deposit(amount)`.

You can use Anchor TS from a script in `tests/` or any client that has the program ID and IDL.

---

## 5. Wire the app

In **apps/web/.env** (and your deployment env):

```env
VITE_SOLANA_RPC=https://api.devnet.solana.com
VITE_PULSE_MINT=<your $PULSE mint address, e.g. from pump.fun>
VITE_REWARD_PROGRAM_ID=<the program ID from step 3>
```

Redeploy or rebuild the web app so it uses this program for daily check-in and (when you add it) redeem.

---

## Summary

| Step | Command / action |
|------|-------------------|
| Build | `cd contracts/rewards-solana && anchor build` |
| Fund wallet (devnet) | `solana airdrop 2 --url devnet` |
| Deploy (devnet) | `anchor deploy --provider.cluster devnet` |
| Deploy (mainnet) | `anchor deploy --provider.cluster mainnet` |
| After deploy | Call `initialize`, `set_redemption_rate`, `init_daily_config`, then `deposit` |
| App | Set `VITE_SOLANA_RPC`, `VITE_PULSE_MINT`, `VITE_REWARD_PROGRAM_ID` in web app env |
