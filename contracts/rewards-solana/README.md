# Reward Vault (Solana)

Solana program for **$PULSE** (or any SPL token) reward payouts. The vault holds tokens; only the **owner** can deposit and transfer to recipients (e.g. when fulfilling points redemptions from your backend).

Points and who may redeem stay in your API; this program only holds and sends tokens.

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

- **Option A — Homebrew (macOS):**  
  `brew install solana`  
  Then ensure `solana` and the directory that contains `cargo-build-sbf` are on your `PATH` (run `brew list solana` or `which solana` to confirm).

- **Option B — Manual download:**  
  Open [Solana releases](https://github.com/solana-labs/solana/releases) in a browser, download the tarball for your OS (e.g. `solana-release-aarch64-apple-darwin.tar.bz2` for Apple Silicon), extract it, and add the `bin` folder to your `PATH`.

- **Option C — Different network:**  
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

After `initialize` succeeds, the vault PDA and its token account exist. You can then **deposit** (owner sends tokens to the vault ATA) and **transfer_to** (owner sends from vault ATA to a recipient).

## Instructions

### `initialize(owner, mint)`

- Creates the vault PDA (seeds: `["vault", mint]`) and a token account (ATA) owned by that PDA.
- Call **once per token mint** (e.g. once for $PULSE).
- **Accounts:** owner (signer), mint, vault (init), vault_token_account (init ATA, authority = vault), token_program, associated_token_program, system_program.

### `deposit(amount)`

- Owner transfers `amount` (in token base units) from their token account to the vault’s token account.
- **Accounts:** owner (signer), vault, owner_token_account, vault_token_account, token_program.

### `transfer_to(amount)`

- Owner sends `amount` from the vault’s token account to a recipient’s token account (e.g. when fulfilling a redemption).
- **Accounts:** owner (signer), vault, vault_token_account, recipient_token_account, token_program.

## Flow

1. Deploy the program and run `initialize` with your wallet as owner and $PULSE mint address.
2. As owner, **deposit** $PULSE into the vault (transfer from your wallet to the vault ATA).
3. When a user redeems points in your app, backend records it and you (or an admin) call **transfer_to** with the user’s Solana token account and the amount to send.

## $PULSE mint

$PULSE lives on Solana (e.g. [Pump.fun](https://pump.fun)); use its mint address when calling `initialize`. Recipients must have an ATA for that mint so they can receive the transfer.

## Troubleshooting

### `anchor build` fails with "no such command: build-sbf"

Anchor runs `cargo build-sbf` under the hood. That subcommand is provided by the Solana CLI; Cargo finds it by looking for a `cargo-build-sbf` binary on your `PATH`.

- **If you installed Solana via Homebrew:**  
  Ensure Solana’s `bin` directory is on your `PATH` **before** your Cargo bin (so Cargo sees `cargo-build-sbf`):

  ```bash
  export PATH="$(brew --prefix solana)/bin:$PATH"
  ```

  Add that line to your `~/.zshrc` (or `~/.bashrc`) so it’s set in every shell. Then run `anchor build` again.

- **If `cargo-build-sbf` still isn’t found:**  
  Some Homebrew setups may not expose it. Use one of:

  1. **Manual tarball:**  
     Download the [Solana release tarball](https://github.com/solana-labs/solana/releases) for your OS (e.g. `solana-release-aarch64-apple-darwin.tar.bz2` for Apple Silicon), extract it, and add the extracted `bin` folder to the **front** of your `PATH`. That `bin` includes both `solana` and `cargo-build-sbf`.

  2. **Official install script** (if your network allows):  
     `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`  
     Then use the path it prints (e.g. `~/.local/share/solana/install/active_release/bin`) and prepend it to `PATH`.

After fixing `PATH`, run `anchor build` from `contracts/rewards-solana` again.

## See also

- [Points and Redemption](../../docs/points-and-redemption.md) — how points and redemption work with the API and this vault.
