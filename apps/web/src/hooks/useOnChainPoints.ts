import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { fetchOnChainPointsBalance } from '../lib/solana/points';

/**
 * Fetches and exposes the connected wallet's on-chain points balance.
 * Use for redeem UI and display in dashboard.
 */
export function useOnChainPoints() {
  const { walletPublicKey } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!walletPublicKey) {
      setBalance(0);
      return;
    }
    setLoading(true);
    try {
      const b = await fetchOnChainPointsBalance(walletPublicKey);
      setBalance(b);
    } catch {
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [walletPublicKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, loading, refresh };
}
