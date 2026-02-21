/**
 * Solana wallet-adapter provider: Connection + Wallet + Modal.
 * WalletConnect: PWA stays open → user opens wallet app → signs → returns to PWA.
 * @see https://solana.com/developers/cookbook/wallets/connect-wallet-react
 */
import { useMemo, type ReactNode } from 'react';
import {
  ConnectionProvider,
  WalletProvider as AdapterWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import type { Adapter } from '@solana/wallet-adapter-base';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

const RPC = (import.meta.env.VITE_SOLANA_RPC as string)?.trim() || 'https://api.devnet.solana.com';
const walletConnectProjectId = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string)?.trim();

function walletConnectNetwork(): WalletAdapterNetwork.Mainnet | WalletAdapterNetwork.Devnet {
  return RPC.includes('devnet') ? WalletAdapterNetwork.Devnet : WalletAdapterNetwork.Mainnet;
}

type Props = { children: ReactNode };

export function SolanaProvider({ children }: Props) {
  const endpoint = useMemo(() => RPC, []);
  const wallets = useMemo((): Adapter[] => {
    const list: Adapter[] = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
    if (walletConnectProjectId) {
      list.push(
        new WalletConnectWalletAdapter({
          network: walletConnectNetwork(),
          options: { projectId: walletConnectProjectId },
        })
      );
    }
    return list;
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <AdapterWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </AdapterWalletProvider>
    </ConnectionProvider>
  );
}
