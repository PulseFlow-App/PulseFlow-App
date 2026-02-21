/**
 * App wallet API: thin wrapper over @solana/wallet-adapter-react.
 * Provides walletPublicKey, connect (open modal), disconnect, holdsPulse, refreshPulseBalance, etc.
 * Must be used inside SolanaProvider.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useWallet as useAdapterWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { getSolanaConfig } from '../lib/solana/config';

type WalletContextValue = {
  walletPublicKey: string | null;
  holdsPulse: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  isWalletAvailable: boolean;
  refreshPulseBalance: () => Promise<void>;
  connectError: string | null;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletContextProvider({ children }: { children: ReactNode }) {
  const { publicKey, disconnect: adapterDisconnect, connecting } = useAdapterWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const [holdsPulse, setHoldsPulse] = useState(false);

  const walletPublicKey = publicKey?.toBase58() ?? null;
  const { mint: PULSE_MINT } = getSolanaConfig();

  const fetchPulseBalance = useCallback(
    async (pubkey: string): Promise<boolean> => {
      if (!PULSE_MINT) return false;
      try {
        const mint = new PublicKey(PULSE_MINT);
        const owner = new PublicKey(pubkey);
        const ata = getAssociatedTokenAddressSync(mint, owner);
        const balance = await connection.getTokenAccountBalance(ata);
        return Boolean(balance?.value?.uiAmount && balance.value.uiAmount > 0);
      } catch {
        return false;
      }
    },
    [connection, PULSE_MINT]
  );

  const refreshPulseBalance = useCallback(async () => {
    if (walletPublicKey) {
      const holds = await fetchPulseBalance(walletPublicKey);
      setHoldsPulse(holds);
    }
  }, [walletPublicKey, fetchPulseBalance]);

  useEffect(() => {
    if (!walletPublicKey) {
      setHoldsPulse(false);
      return;
    }
    let cancelled = false;
    fetchPulseBalance(walletPublicKey).then((holds) => {
      if (!cancelled) setHoldsPulse(holds);
    });
    return () => {
      cancelled = true;
    };
  }, [walletPublicKey, fetchPulseBalance]);

  const connect = useCallback(async () => {
    setVisible(true);
  }, [setVisible]);

  const disconnect = useCallback(() => {
    adapterDisconnect();
  }, [adapterDisconnect]);

  const value: WalletContextValue = {
    walletPublicKey,
    holdsPulse,
    isLoading: connecting,
    connect,
    disconnect,
    isWalletAvailable: true,
    refreshPulseBalance,
    connectError: null,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletContextProvider (inside SolanaProvider)');
  return ctx;
}

export function useHasWallet(): boolean {
  const ctx = useContext(WalletContext);
  return !!ctx?.walletPublicKey;
}

export function useHasPulseLabAccess(): boolean {
  const ctx = useContext(WalletContext);
  return !!ctx?.walletPublicKey && !!ctx?.holdsPulse;
}
