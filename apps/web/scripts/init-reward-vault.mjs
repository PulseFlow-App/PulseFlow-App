#!/usr/bin/env node
/**
 * Initialize the reward_vault program on devnet:
 * 1. Optionally create an SPL token mint (if PULSE_MINT not set).
 * 2. Initialize the vault (owner + mint).
 * 3. Init daily config (points per check-in, cooldown).
 *
 * Prerequisites:
 * - Deployer keypair at ~/.config/solana/id.json with devnet SOL.
 * - Set in apps/web/.env: VITE_REWARD_PROGRAM_ID and optionally VITE_PULSE_MINT.
 *
 * Run from repo root: node apps/web/scripts/init-reward-vault.mjs
 * Or from apps/web: node scripts/init-reward-vault.mjs
 * (Loads .env from apps/web if run from there.)
 */

import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createMint,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*(?:VITE_)?(REWARD_PROGRAM_ID|PULSE_MINT|SOLANA_RPC)\s*=\s*(.+?)(?:\s*#.*)?$/);
      if (m) {
        const key = m[1];
        const val = m[2].trim().replace(/^["']|["']$/g, '');
        if (val && !process.env[key]) process.env[key] = val;
        if (val && line.includes('VITE_') && !process.env['VITE_' + key]) process.env['VITE_' + key] = val;
      }
    }
  }
}

function getDiscriminator(name) {
  const msg = Buffer.from(`global:${name}`, 'utf8');
  return createHash('sha256').update(msg).digest().slice(0, 8);
}

function keypairFromFile(filePath) {
  const resolved = path.resolve(filePath.replace(/^~/, process.env.HOME || ''));
  const buf = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(buf));
}

async function main() {
  loadEnv();

  const programIdStr = process.env.REWARD_PROGRAM_ID || process.env.VITE_REWARD_PROGRAM_ID;
  const mintStr = process.env.PULSE_MINT || process.env.VITE_PULSE_MINT;
  const rpc = process.env.VITE_SOLANA_RPC || process.env.SOLANA_RPC || 'https://api.devnet.solana.com';

  if (!programIdStr) {
    console.error('Set VITE_REWARD_PROGRAM_ID (or REWARD_PROGRAM_ID) in apps/web/.env');
    process.exit(1);
  }

  const connection = new Connection(rpc);
  const programId = new PublicKey(programIdStr);
  const keypairPath = path.join(process.env.HOME || '', '.config/solana/id.json');
  if (!fs.existsSync(keypairPath)) {
    console.error('Deployer keypair not found at', keypairPath);
    process.exit(1);
  }
  const owner = keypairFromFile(keypairPath);

  let mint;
  if (mintStr) {
    mint = new PublicKey(mintStr);
    console.log('Using existing mint:', mint.toBase58());
  } else {
    console.log('Creating new SPL token mint on devnet...');
    mint = await createMint(
      connection,
      owner,
      owner.publicKey,
      null,
      9,
      undefined,
      { commitment: 'confirmed' },
      TOKEN_PROGRAM_ID
    );
    console.log('Created mint:', mint.toBase58());
    console.log('Add to apps/web/.env: VITE_PULSE_MINT=' + mint.toBase58());
  }

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), mint.toBuffer()],
    programId
  );

  const vaultAta = getAssociatedTokenAddressSync(mint, vaultPda, true);

  const initDisc = getDiscriminator('initialize');
  const initIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: owner.publicKey, isSigner: true, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: vaultAta, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(initDisc),
  });

  console.log('Sending initialize...');
  const tx1 = new Transaction().add(initIx);
  const sig1 = await sendAndConfirmTransaction(connection, tx1, [owner], { commitment: 'confirmed' });
  console.log('Initialize tx:', sig1);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config'), vaultPda.toBuffer()],
    programId
  );

  const dailyCheckInPoints = 10;
  const cooldownSecs = 86400; // 24h
  const configDisc = getDiscriminator('init_daily_config');
  const data = Buffer.alloc(8 + 8 + 8);
  Buffer.from(configDisc).copy(data, 0);
  data.writeBigUInt64LE(BigInt(dailyCheckInPoints), 8);
  data.writeBigUInt64LE(BigInt(cooldownSecs), 16);

  const configIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: owner.publicKey, isSigner: true, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: false },
      { pubkey: configPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  console.log('Sending init_daily_config (points=%s, cooldown=%ss)...', dailyCheckInPoints, cooldownSecs);
  const tx2 = new Transaction().add(configIx);
  const sig2 = await sendAndConfirmTransaction(connection, tx2, [owner], { commitment: 'confirmed' });
  console.log('Init daily config tx:', sig2);

  console.log('Done. Vault initialized; daily check-in: %s points every %s seconds.', dailyCheckInPoints, cooldownSecs);
  if (!mintStr) console.log('Set VITE_PULSE_MINT=' + mint.toBase58() + ' in apps/web/.env and restart the app.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
