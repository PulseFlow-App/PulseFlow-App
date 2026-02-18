/**
 * Solana / rewards program config from env.
 * Used for on-chain daily check-in, points, and redeem.
 */
export const SOLANA_RPC =
  (import.meta.env.VITE_SOLANA_RPC as string)?.trim() || 'https://api.devnet.solana.com';

export const PULSE_MINT = (import.meta.env.VITE_PULSE_MINT as string)?.trim() || '';

/** Deployed reward_vault program ID (required for daily_check_in, redeem). */
export const REWARD_PROGRAM_ID = (import.meta.env.VITE_REWARD_PROGRAM_ID as string)?.trim() || '';

export function getSolanaConfig() {
  return {
    rpc: SOLANA_RPC,
    mint: PULSE_MINT,
    programId: REWARD_PROGRAM_ID,
    isConfigured: !!REWARD_PROGRAM_ID && !!PULSE_MINT,
  };
}
