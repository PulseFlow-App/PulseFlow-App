/**
 * Solana wallet-adapter provider: Connection + Wallet + Modal.
 * Wrap the app so useWallet() and the wallet modal work.
 * @see https://solana.com/developers/cookbook/wallets/connect-wallet-react
 */
import { useMemo, type ReactNode } from 'react';
import {
  ConnectionProvider,
  WalletProvider as AdapterWalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

const RPC = (import.meta.env.VITE_SOLANA_RPC as string)?.trim() || 'https://api.devnet.solana.com';

type Props = { children: ReactNode };

export function SolanaProvider({ children }: Props) {
  const endpoint = useMemo(() => RPC, []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <AdapterWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </AdapterWalletProvider>
    </ConnectionProvider>
  );
}
