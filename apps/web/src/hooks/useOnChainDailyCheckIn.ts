import { useState, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getSolanaConfig } from '../lib/solana/config';
import { submitDailyCheckIn } from '../lib/solana/dailyCheckIn';

export type DailyCheckInStatus = 'idle' | 'loading' | 'success' | 'error' | 'not_available';

export function useOnChainDailyCheckIn() {
  const { walletPublicKey, refreshPulseBalance } = useWallet();
  const [status, setStatus] = useState<DailyCheckInStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const { isConfigured } = getSolanaConfig();

  const trigger = useCallback(async () => {
    if (!walletPublicKey) {
      setStatus('not_available');
      setError('Connect your wallet first');
      return;
    }
    if (!isConfigured) {
      setStatus('not_available');
      setError('On-chain rewards not configured');
      return;
    }
    setStatus('loading');
    setError(null);
    const result = await submitDailyCheckIn();
    if (result.success) {
      setStatus('success');
      await refreshPulseBalance();
    } else {
      setStatus('error');
      setError(result.error ?? 'Transaction failed');
    }
  }, [walletPublicKey, isConfigured, refreshPulseBalance]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    trigger,
    reset,
    status,
    error,
    canCheckIn: !!walletPublicKey && isConfigured,
  };
}
