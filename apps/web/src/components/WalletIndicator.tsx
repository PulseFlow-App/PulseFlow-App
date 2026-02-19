import { useWallet } from '../contexts/WalletContext';
import styles from './WalletIndicator.module.css';

type Props = {
  /** When true, show compact (e.g. in check-in header). */
  compact?: boolean;
  className?: string;
};

/**
 * Shows connected wallet (truncated) or "Connect wallet" button.
 * Use in check-in headers and anywhere we want wallet status visible.
 */
export function WalletIndicator({ compact, className }: Props) {
  const { walletPublicKey, connect, disconnect, isWalletAvailable, isLoading } = useWallet();

  if (walletPublicKey) {
    const short = `${walletPublicKey.slice(0, 4)}…${walletPublicKey.slice(-4)}`;
    return (
      <div className={[styles.wrap, compact && styles.compact, className].filter(Boolean).join(' ')}>
        <span className={styles.address} title={walletPublicKey}>
          {short}
        </span>
        {!compact && (
          <button type="button" onClick={disconnect} className={styles.disconnect}>
            Disconnect
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={[styles.wrap, compact && styles.compact, className].filter(Boolean).join(' ')}>
      {isWalletAvailable ? (
        <button
          type="button"
          onClick={connect}
          disabled={isLoading}
          className={styles.connect}
        >
          {isLoading ? 'Connecting…' : 'Connect wallet'}
        </button>
      ) : (
        <a
          href="https://phantom.app/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.connect}
          title="Install Phantom, Solflare, or any Solana wallet"
        >
          Connect wallet
        </a>
      )}
    </div>
  );
}
