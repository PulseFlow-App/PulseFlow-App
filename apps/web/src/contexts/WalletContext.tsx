import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

const WALLET_STORAGE_KEY = '@pulse/connected_wallet';

const SOLANA_RPC =
  (import.meta.env.VITE_SOLANA_RPC as string)?.trim() || 'https://api.devnet.solana.com';
const PULSE_MINT = (import.meta.env.VITE_PULSE_MINT as string)?.trim() || '';

type WalletContextValue = {
  /** Wallet public key (base58) when connected; null when not. */
  walletPublicKey: string | null;
  /** Whether the connected wallet holds $PULSE (balance > 0). */
  holdsPulse: boolean;
  /** True when we're resolving Phantom or fetching balance. */
  isLoading: boolean;
  /** Connect via Phantom (or other injected wallet). */
  connect: () => Promise<void>;
  /** Disconnect and clear stored address. */
  disconnect: () => void;
  /** True if a Solana wallet (Phantom, Solflare, etc.) is available to connect. */
  isWalletAvailable: boolean;
  /** Refresh PULSE balance (e.g. after redeem). */
  refreshPulseBalance: () => Promise<void>;
  /** User-friendly error after a failed connect (e.g. Phantom service worker disconnected). Clear on next attempt. */
  connectError: string | null;
};

const WalletContext = createContext<WalletContextValue | null>(null);

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      publicKey: { toBase58(): string } | null;
      connect(): Promise<{ publicKey: { toBase58(): string } }>;
      disconnect(): Promise<void>;
      on?(event: string, cb: () => void): void;
    };
  }
}

/** Any Solana-compatible wallet (Phantom, Solflare, Backpack, etc.) that injects window.solana (Wallet Standard). */
function getInjectedWallet() {
  if (typeof window === 'undefined') return null;
  const w = window.solana;
  if (!w || typeof w.connect !== 'function') return null;
  return w;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletPublicKey, setWalletPublicKey] = useState<string | null>(() => {
    try {
      return localStorage.getItem(WALLET_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [holdsPulse, setHoldsPulse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const isWalletAvailable = !!getInjectedWallet();

  const fetchPulseBalance = useCallback(async (pubkey: string) => {
    if (!PULSE_MINT) {
      setHoldsPulse(false);
      return;
    }
    try {
      const { Connection } = await import('@solana/web3.js');
      const connection = new Connection(SOLANA_RPC);
      const mint = new PublicKey(PULSE_MINT);
      const owner = new PublicKey(pubkey);
      const ata = getAssociatedTokenAddressSync(mint, owner);
      const balance = await connection.getTokenAccountBalance(ata);
      setHoldsPulse(Boolean(balance?.value?.uiAmount && balance.value.uiAmount > 0));
    } catch {
      setHoldsPulse(false);
    }
  }, []);

  const refreshPulseBalance = useCallback(async () => {
    if (walletPublicKey) await fetchPulseBalance(walletPublicKey);
  }, [walletPublicKey, fetchPulseBalance]);

  useEffect(() => {
    if (!walletPublicKey) {
      setHoldsPulse(false);
      return;
    }
    let cancelled = false;
    (async () => {
      await fetchPulseBalance(walletPublicKey);
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [walletPublicKey, fetchPulseBalance]);

  const connect = useCallback(async () => {
    const wallet = getInjectedWallet();
    if (!wallet) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    setConnectError(null);
    setIsLoading(true);
    try {
      const { publicKey } = await wallet.connect();
      const address = publicKey.toBase58();
      setWalletPublicKey(address);
      try {
        localStorage.setItem(WALLET_STORAGE_KEY, address);
      } catch {
        // ignore
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isDisconnected =
        /disconnected port|Receiving end does not exist|connection/i.test(message);
      setConnectError(
        isDisconnected
          ? 'Wallet extension may be locked or restarting. Unlock Phantom (or your wallet), then try again, or refresh the page.'
          : 'Connection failed. Unlock your wallet and try again.'
      );
      if (import.meta.env.DEV) console.warn('Wallet connect error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    const wallet = getInjectedWallet();
    wallet?.disconnect?.().catch(() => {});
    setWalletPublicKey(null);
    setHoldsPulse(false);
    setConnectError(null);
    try {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value: WalletContextValue = {
    walletPublicKey,
    holdsPulse,
    isLoading,
    connect,
    disconnect,
    isWalletAvailable,
    refreshPulseBalance,
    connectError,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

/** True if user has connected wallet (privileged tier). */
export function useHasWallet(): boolean {
  const ctx = useContext(WalletContext);
  return !!ctx?.walletPublicKey;
}

/** True if user has wallet and holds PULSE (Pulse Lab tier). */
export function useHasPulseLabAccess(): boolean {
  const ctx = useContext(WalletContext);
  return !!ctx?.walletPublicKey && !!ctx?.holdsPulse;
}
