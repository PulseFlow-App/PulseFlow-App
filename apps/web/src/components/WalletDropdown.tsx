import { useState, useRef, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import styles from './WalletDropdown.module.css';

type Props = {
  className?: string;
};

/**
 * Wallet menu in header: click to open dropdown with address, copy, disconnect, switch wallet.
 */
export function WalletDropdown({ className }: Props) {
  const { walletPublicKey, connect, disconnect, isWalletAvailable, isLoading } = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const copyAddress = () => {
    if (walletPublicKey) {
      navigator.clipboard.writeText(walletPublicKey);
      setOpen(false);
    }
  };

  const handleSwitchWallet = () => {
    setOpen(false);
    disconnect();
    setTimeout(() => connect(), 100);
  };

  if (walletPublicKey) {
    const short = `${walletPublicKey.slice(0, 4)}…${walletPublicKey.slice(-4)}`;
    return (
      <div className={[styles.wrap, className].filter(Boolean).join(' ')} ref={ref}>
        <button
          type="button"
          className={styles.trigger}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label="Wallet menu"
        >
          <span className={styles.address}>{short}</span>
          <span className={styles.chevron} aria-hidden>▼</span>
        </button>
        {open && (
          <div className={styles.menu} role="menu">
            <div className={styles.menuItem}>
              <span className={styles.menuLabel}>Connected</span>
              <span className={styles.menuValue} title={walletPublicKey}>
                {short}
              </span>
            </div>
            <button type="button" className={styles.menuAction} onClick={copyAddress} role="menuitem">
              Copy address
            </button>
            <button type="button" className={styles.menuAction} onClick={handleSwitchWallet} role="menuitem">
              Switch wallet
            </button>
            <button type="button" className={styles.menuAction} onClick={() => { disconnect(); setOpen(false); }} role="menuitem">
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      {isWalletAvailable ? (
        <button
          type="button"
          className={styles.connectBtn}
          onClick={connect}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting…' : 'Connect wallet'}
        </button>
      ) : (
        <a
          href="https://phantom.app/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.connectBtn}
        >
          Get Phantom
        </a>
      )}
    </div>
  );
}
