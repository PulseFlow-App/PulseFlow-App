/**
 * Solana / rewards program integration.
 * - config: RPC, mint, program ID from env
 * - dailyCheckIn: build and submit daily_check_in instruction
 * - points: fetch on-chain points balance (for redeem UI)
 */

export { getSolanaConfig, SOLANA_RPC, PULSE_MINT, REWARD_PROGRAM_ID } from './config';
export {
  buildDailyCheckInInstruction,
  buildDailyCheckInTransaction,
  submitDailyCheckIn,
} from './dailyCheckIn';
export { fetchOnChainPointsBalance } from './points';
