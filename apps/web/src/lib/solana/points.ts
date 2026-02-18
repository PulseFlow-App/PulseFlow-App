import { Connection, PublicKey } from '@solana/web3.js';
import { getSolanaConfig } from './config';

/**
 * PointsAccount layout: discriminator (8) + user (32) + balance (8) + bump (1) = 49.
 */
const POINTS_ACCOUNT_BALANCE_OFFSET = 8 + 32;

/**
 * Fetch on-chain points balance for a wallet.
 * Returns 0 if account doesn't exist or config is missing.
 */
export async function fetchOnChainPointsBalance(
  walletPublicKey: string
): Promise<number> {
  const { programId, mint, rpc } = getSolanaConfig();
  if (!programId || !mint) return 0;
  try {
    const connection = new Connection(rpc);
    const mintPk = new PublicKey(mint);
    const programPk = new PublicKey(programId);
    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), mintPk.toBuffer()],
      programPk
    );
    const [pointsPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('points'), vaultPda.toBuffer(), new PublicKey(walletPublicKey).toBuffer()],
      programPk
    );
    const accountInfo = await connection.getAccountInfo(pointsPda);
    if (!accountInfo?.data || accountInfo.data.length < POINTS_ACCOUNT_BALANCE_OFFSET + 8)
      return 0;
    const data = accountInfo.data;
    const balance = data.readBigUInt64LE(POINTS_ACCOUNT_BALANCE_OFFSET);
    return Number(balance);
  } catch {
    return 0;
  }
}
