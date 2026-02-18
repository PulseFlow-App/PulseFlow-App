import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import { getSolanaConfig } from './config';

async function getDiscriminator(name: string): Promise<Uint8Array> {
  const msg = new TextEncoder().encode(`global:${name}`);
  const hash = await crypto.subtle.digest('SHA-256', msg);
  return new Uint8Array(hash).slice(0, 8);
}

async function getDailyCheckInDiscriminator(): Promise<Uint8Array> {
  return getDiscriminator('daily_check_in');
}

async function getCreateUserDailyDiscriminator(): Promise<Uint8Array> {
  return getDiscriminator('create_user_daily');
}

function getProgramId(): PublicKey {
  const { programId } = getSolanaConfig();
  if (!programId) throw new Error('VITE_REWARD_PROGRAM_ID is not set');
  return new PublicKey(programId);
}

function getMint(): PublicKey {
  const { mint } = getSolanaConfig();
  if (!mint) throw new Error('VITE_PULSE_MINT is not set');
  return new PublicKey(mint);
}

/**
 * Build the daily_check_in instruction for the reward_vault program.
 * PDAs: vault = [vault, mint], config = [config, vault], daily_claim = [daily, vault, user], points = [points, vault, user].
 */
export async function buildDailyCheckInInstruction(
  userPublicKey: PublicKey
): Promise<TransactionInstruction> {
  const discriminator = await getDailyCheckInDiscriminator();
  const programId = getProgramId();
  const mint = getMint();

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), mint.toBuffer()],
    programId
  );
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config'), vaultPda.toBuffer()],
    programId
  );
  const [dailyClaimPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('daily'), vaultPda.toBuffer(), userPublicKey.toBuffer()],
    programId
  );
  const [pointsPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('points'), vaultPda.toBuffer(), userPublicKey.toBuffer()],
    programId
  );

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: userPublicKey, isSigner: true, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: false },
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: dailyClaimPda, isSigner: false, isWritable: true },
      { pubkey: pointsPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(discriminator),
  });
}

/**
 * Build the create_user_daily instruction. Call once per user before first daily_check_in.
 */
export async function buildCreateUserDailyInstruction(
  userPublicKey: PublicKey
): Promise<TransactionInstruction> {
  const discriminator = await getCreateUserDailyDiscriminator();
  const programId = getProgramId();
  const mint = getMint();

  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), mint.toBuffer()],
    programId
  );
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config'), vaultPda.toBuffer()],
    programId
  );
  const [dailyClaimPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('daily'), vaultPda.toBuffer(), userPublicKey.toBuffer()],
    programId
  );
  const [pointsPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('points'), vaultPda.toBuffer(), userPublicKey.toBuffer()],
    programId
  );

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: userPublicKey, isSigner: true, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: false },
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: dailyClaimPda, isSigner: false, isWritable: true },
      { pubkey: pointsPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(discriminator),
  });
}

/**
 * Build and return transaction for create_user_daily (for wallet to sign and send).
 */
export async function buildCreateUserDailyTransaction(
  userPublicKey: PublicKey
): Promise<Transaction> {
  const ix = await buildCreateUserDailyInstruction(userPublicKey);
  const tx = new Transaction().add(ix);
  const { rpc } = getSolanaConfig();
  const connection = new Connection(rpc);
  const { blockhash } = await connection.getLatestBlockhash('finalized');
  tx.recentBlockhash = blockhash;
  tx.feePayer = userPublicKey;
  return tx;
}

/**
 * Returns true if the user's daily_claim PDA exists on-chain (so daily_check_in can be used).
 */
export async function userHasDailySetup(userPublicKey: PublicKey): Promise<boolean> {
  const programId = getProgramId();
  const mint = getMint();
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), mint.toBuffer()],
    programId
  );
  const [dailyClaimPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('daily'), vaultPda.toBuffer(), userPublicKey.toBuffer()],
    programId
  );
  const { rpc } = getSolanaConfig();
  const connection = new Connection(rpc);
  const info = await connection.getAccountInfo(dailyClaimPda);
  return info != null;
}

/**
 * Build and return transaction for daily_check_in (for wallet to sign and send).
 */
export async function buildDailyCheckInTransaction(
  userPublicKey: PublicKey
): Promise<Transaction> {
  const ix = await buildDailyCheckInInstruction(userPublicKey);
  const tx = new Transaction().add(ix);
  const { rpc } = getSolanaConfig();
  const connection = new Connection(rpc);
  const { blockhash } = await connection.getLatestBlockhash('finalized');
  tx.recentBlockhash = blockhash;
  tx.feePayer = userPublicKey;
  return tx;
}

type PhantomWallet = {
  publicKey: { toBase58(): string } | null;
  signTransaction?(tx: Transaction): Promise<Transaction>;
  signAndSendTransaction?(tx: Transaction): Promise<{ signature: string }>;
};

function getWallet(): PhantomWallet | null {
  if (typeof window === 'undefined') return null;
  const w = (window as unknown as { solana?: PhantomWallet }).solana;
  return w?.publicKey ? w : null;
}

async function sendTransaction(
  wallet: PhantomWallet,
  tx: Transaction
): Promise<{ success: boolean; error?: string }> {
  const { rpc } = getSolanaConfig();
  const connection = new Connection(rpc);
  if (wallet.signAndSendTransaction) {
    const { signature } = await wallet.signAndSendTransaction(tx);
    await connection.confirmTransaction(signature, 'finalized');
    return { success: true };
  }
  if (wallet.signTransaction) {
    const signed = await wallet.signTransaction(tx);
    const txid = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });
    await connection.confirmTransaction(txid, 'finalized');
    return { success: true };
  }
  return { success: false, error: 'Wallet cannot sign transactions' };
}

/**
 * Submit create_user_daily: creates daily_claim and points PDAs. Call once before first daily_check_in.
 */
export async function submitCreateUserDaily(): Promise<{ success: boolean; error?: string }> {
  const wallet = getWallet();
  if (!wallet?.publicKey) {
    return { success: false, error: 'Wallet not connected' };
  }
  const { programId } = getSolanaConfig();
  if (!programId) {
    return { success: false, error: 'Rewards program not configured' };
  }
  try {
    const userPubkey = new PublicKey(wallet.publicKey.toBase58());
    const tx = await buildCreateUserDailyTransaction(userPubkey);
    return sendTransaction(wallet, tx);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

/**
 * Submit daily_check_in: build tx, sign with Phantom (or injected wallet), send.
 * If the user has not run create_user_daily yet, runs that first then daily_check_in.
 */
export async function submitDailyCheckIn(): Promise<{ success: boolean; error?: string }> {
  const wallet = getWallet();
  if (!wallet?.publicKey) {
    return { success: false, error: 'Wallet not connected' };
  }
  const { programId, rpc } = getSolanaConfig();
  if (!programId) {
    return { success: false, error: 'Rewards program not configured' };
  }
  try {
    const userPubkey = new PublicKey(wallet.publicKey.toBase58());
    const hasSetup = await userHasDailySetup(userPubkey);
    if (!hasSetup) {
      const createResult = await submitCreateUserDaily();
      if (!createResult.success) return createResult;
    }
    const tx = await buildDailyCheckInTransaction(userPubkey);
    return sendTransaction(wallet, tx);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}
