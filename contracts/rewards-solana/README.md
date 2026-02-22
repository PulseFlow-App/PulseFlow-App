# Reward Vault (Solana)

Solana program for **$PULSE** (or any SPL token) reward payouts and **on-chain points** redeemable for tokens.

- The vault holds tokens; the **owner** can deposit and transfer to recipients.
- **On-chain points**: users can **earn** points without your API (e.g. **daily check-in**: connect wallet, call the program once per cooldown). Owner can also **credit** points to user PDAs. Users **redeem** points for tokens at a configurable rate.
- So points can be tracked **fully on-chain** (wallet = identity); no API or DB required for earning.

## Requirements

Install these **before** `anchor build` (Anchor uses the Solana toolchain to compile programs). After each step, restart your terminal or `source` the env so the new binary is on `PATH`.

1. **[Rust](https://rustup.rs/)** (1.75+):  
   `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`  
   Then ensure Cargo’s bin is on `PATH`: `export PATH="$HOME/.cargo/bin:$PATH"` (add to `~/.zshrc` to make it permanent).

2. **[Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)** (provides `cargo build-sbf`):  
   `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"` then add the install dir to `PATH` (see installer output).  
   Or on macOS: `brew install solana` (then `solana` is usually in `/opt/homebrew/bin`).

3. **[Anchor](https://www.anchor-lang.com/docs/installation)** 0.30.x (requires Rust):  
   `cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli`  
   The `anchor` binary is installed into `~/.cargo/bin`; ensure that directory is on your `PATH` (step 1).

**If the Solana install script fails with SSL (e.g. `curl: (35) LibreSSL SSL_connect: SSL_ERROR_SYSCALL`):**

- **Option A  - Homebrew (macOS):**  
  `brew install solana`  
  Then ensure `solana` and the directory that contains `cargo-build-sbf` are on your `PATH` (run `brew list solana` or `which solana` to confirm).

- **Option B  - Manual download:**  
  Open [Solana releases](https://github.com/solana-labs/solana/releases) in a browser, download the tarball for your OS (e.g. `solana-release-aarch64-apple-darwin.tar.bz2` for Apple Silicon), extract it, and add the `bin` folder to your `PATH`.

- **Option C  - Different network:**  
  Try from another network or with VPN disabled; some networks or proxies break the script’s HTTPS connection.

## 1. Build

```bash
cd contracts/rewards-solana
anchor build
```

The placeholder program ID in the repo is valid for build. On first successful build, Anchor writes the keypair to `target/deploy/reward_vault-keypair.json` and the program ID into `declare_id!(...)` and `Anchor.toml`. To use **your own** keypair instead (e.g. for a known program ID):

```bash
solana keygen new -o target/deploy/reward_vault-keypair.json
anchor keys list   # copy the program ID
# Paste that ID into declare_id!(...) in programs/reward_vault/src/lib.rs and into Anchor.toml [programs.*]
anchor build
```

## 2. Deploy

1. Set cluster and wallet in `Anchor.toml` (e.g. `cluster = "devnet"` or `"mainnet-beta"`), or override when deploying.
2. Ensure your wallet has SOL for deploy (e.g. `solana airdrop 2` on devnet).
3. Deploy:

```bash
# Devnet
anchor deploy --provider.cluster devnet

# Mainnet (use when you're ready for real $PULSE)
anchor deploy --provider.cluster mainnet
```

4. Save the printed **program ID**; you need it to call `initialize` and for any client/script.

### After deploy: initialize vault + daily config (one script)

From the **web app** you can run a script that (1) optionally creates a new SPL mint on devnet if you don’t have one, (2) calls **initialize**, (3) calls **init_daily_config** (e.g. 10 points per check-in, 24h cooldown).

1. In `apps/web/.env` set at least:
   - `VITE_REWARD_PROGRAM_ID=<your deployed program ID>`
   - `VITE_SOLANA_RPC=https://api.devnet.solana.com` (for devnet)
   - Optionally `VITE_PULSE_MINT=<mint>`; if omitted, the script creates a new devnet token and prints its mint for you to add.
2. Ensure your deployer keypair has devnet SOL: `solana airdrop 2 --url devnet` (or use [faucet.solana.com](https://faucet.solana.com)).
3. Run:

```bash
cd apps/web
npm run init-reward-vault
```

The script uses the keypair at `~/.config/solana/id.json`. If it created a new mint, add the printed `VITE_PULSE_MINT=...` to `apps/web/.env` and restart the app so daily check-in and points work.

## 3. Get the $PULSE mint address

$PULSE on Solana: [Pump.fun coin page](https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump). On that page (or in any Solana explorer for the token), copy the **token mint address** (base58). You will pass this as `mint` when calling `initialize`.

If you use a different SPL token for rewards, use that token’s mint address instead.

## 4. Call `initialize` (owner + mint)

Run **once per token** (e.g. once for $PULSE). This creates the vault PDA and the vault’s token account.

You need:

- **Owner:** Your wallet public key (the signer; only this wallet can later `deposit` and `transfer_to`).
- **Mint:** The $PULSE (or reward token) mint public key.

Example using Anchor TS (from a Node script or test; you need `provider` and `program` from your Anchor workspace and IDL, e.g. `Program.at(provider, programId)` with IDL from `target/idl/reward_vault.json`):

```ts
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";

const programId = new PublicKey("YOUR_DEPLOYED_PROGRAM_ID");
const mint = new PublicKey("PULSE_MINT_ADDRESS_FROM_PUMP_FUN_OR_EXPLORER");
const owner = provider.wallet.publicKey; // your wallet (signer)

const [vaultPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), mint.toBuffer()],
  programId
);
const vaultAta = getAssociatedTokenAddressSync(mint, vaultPda, true);

await program.methods
  .initialize()
  .accounts({
    owner,
    mint,
    vault: vaultPda,
    vaultTokenAccount: vaultAta,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

After `initialize` succeeds, the vault PDA and its token account exist. Then:

1. Call **set_redemption_rate** (e.g. `100` for 100 points = 1 token).
2. Call **init_daily_config** (e.g. 30 points per daily check-in, 86400 sec cooldown) so users can earn on-chain.
3. **Deposit** (owner sends tokens to the vault ATA).
4. Users **daily_check_in** (connect wallet, sign once per cooldown) to earn points, or owner **credit_points** to top up.
5. User **redeem** (user signs; program deducts points and sends tokens to their ATA).

Example: derive points PDA for a user (for crediting or reading balance):

```ts
const [pointsPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("points"), vaultPda.toBuffer(), userWallet.toBuffer()],
  programId
);
```

## Instructions

### `initialize(owner, mint)`

- Creates the vault PDA (seeds: `["vault", mint]`) and a token account (ATA) owned by that PDA.
- Call **once per token mint** (e.g. once for $PULSE). Sets redemption rate to 0 until you call `set_redemption_rate`.
- **Accounts:** owner (signer), mint, vault (init), vault_token_account (init ATA, authority = vault), token_program, associated_token_program, system_program.

### `deposit(amount)`

- Owner transfers `amount` (in token base units) from their token account to the vault’s token account.
- **Accounts:** owner (signer), vault, owner_token_account, vault_token_account, token_program.

### `transfer_to(amount)`

- Owner sends `amount` from the vault’s token account to a recipient’s token account (manual payouts).
- **Accounts:** owner (signer), vault, vault_token_account, recipient_token_account, token_program.

### `set_redemption_rate(points_per_token)`

- Owner sets how many points equal one full token. E.g. `100` means 100 points = 1 token (1e decimals).
- **Accounts:** owner (signer), vault.

### `init_daily_config(daily_check_in_points, cooldown_secs)`

- Owner enables **on-chain earning**: users get `daily_check_in_points` (e.g. 30) once per `cooldown_secs` (e.g. 86400 = 24h). No API needed.
- **Accounts:** owner (signer), vault, config (init_if_needed), system_program.

### `daily_check_in()`

- **User** signs; if cooldown has elapsed (or first time), program credits points to their points account. Creates points + daily_claim PDAs if needed (user pays rent). Use this when the app shows “Connect wallet to earn”  - balance is on-chain.
- **Accounts:** user (signer), vault, config, daily_claim (init_if_needed), points_account (init_if_needed), system_program.

### `credit_points(amount)`

- Owner credits **on-chain points** to a user. Creates the user’s points PDA if it doesn’t exist (seeds: `["points", vault.key(), user.key()]`).
- **Accounts:** owner (signer), vault, user (pubkey used for PDA), points_account (init_if_needed), system_program.

### `redeem(points_amount)`

- **User** signs; program deducts `points_amount` from their points account and transfers tokens from the vault to their token account at the vault’s redemption rate. User must have an ATA for the vault mint.
- **Accounts:** user (signer), vault, mint, points_account, vault_token_account, user_token_account, token_program.

## Earning points without the API

If your app or API shows **0 points** (e.g. DB not set, user not synced, or streak/check-ins not sent), users can still earn on-chain:

1. **Connect wallet** in the app (e.g. Phantom, Solflare).
2. Owner has called **init_daily_config** (e.g. `30` points, `86400` sec cooldown).
3. User calls **daily_check_in** once per cooldown window; the program credits points to their **on-chain** points account. Balance is readable from the chain (points PDA); no API needed.
4. User can **redeem** those points for $PULSE as usual.

So **wallet = identity**: points are tracked by wallet pubkey on-chain. You can show balance in the app by fetching the points account (see PDA example above) instead of (or in addition to) `GET /users/me/points`.

## Flow (on-chain points → token)

1. Deploy the program and run **initialize** with your wallet as owner and $PULSE mint address.
2. Call **set_redemption_rate** (e.g. `100` for 100 points = 1 $PULSE).
3. Call **init_daily_config** (e.g. 30 points, 86400 cooldown) so users can earn by daily check-in.
4. As owner, **deposit** $PULSE into the vault.
5. Users earn: **daily_check_in** (on-chain) and/or **credit_points** (owner, e.g. from API).
6. User calls **redeem(points_amount)**; program deducts points and sends tokens to their ATA.
7. Optional: **transfer_to** for manual payouts.

## $PULSE mint

$PULSE lives on Solana (e.g. [Pump.fun](https://pump.fun)); use its mint address when calling `initialize`. Recipients must have an ATA for that mint so they can receive the transfer.

## Troubleshooting

### `anchor build` fails with "no such command: build-sbf"

Anchor needs `cargo-build-sbf`, which comes with the **full Solana CLI**. The Homebrew `solana` package often **does not** include it  - use the **official installer** instead (see below).

- **If you already use the official installer:** ensure its `bin` is first on PATH, e.g. `export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"`, then run `anchor build` again.

- **If you installed Solana via Homebrew only:**  
  Ensure Solana’s `bin` directory is on your `PATH` **before** your Cargo bin (so Cargo sees `cargo-build-sbf`):

  ```bash
  export PATH="$(brew --prefix solana)/bin:$PATH"
  ```

  Add that line to your `~/.zshrc` (or `~/.bashrc`) so it’s set in every shell. Then run `anchor build` again.

- **If `cargo-build-sbf` still isn’t found:**  
  Some Homebrew setups may not expose it. Use one of:

  1. **Manual tarball:**  
     Download the [Solana release tarball](https://github.com/solana-labs/solana/releases) for your OS (e.g. `solana-release-aarch64-apple-darwin.tar.bz2` for Apple Silicon), extract it, and add the extracted `bin` folder to the **front** of your `PATH`. That `bin` includes both `solana` and `cargo-build-sbf`.

  2. **Official install script (recommended):**  
     ```bash
     sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
     export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
     cd contracts/rewards-solana && anchor build
     ```  
     Add the `export PATH=...` line to your `~/.zshrc` so it persists.

After fixing `PATH`, run `anchor build` from `contracts/rewards-solana` again.

## Notes

- **Existing vaults:** If you already deployed a vault before on-chain points were added, the account layout changed (new `points_per_token` field). Re-initialize with a new vault or deploy a new program ID for the updated program.
- **Points PDA:** Each user has one points account per vault (seeds: `["points", vault_pda, user_pubkey]`). Use the same vault PDA when crediting and when the user redeems.
- **Reading balance:** Fetch the `PointsAccount` (points PDA) from the chain to show on-chain balance in your app; no API call needed.

## See also

- [Points and Redemption](../../docs/points-and-redemption.md)  - how points and redemption work with the API and this vault.
