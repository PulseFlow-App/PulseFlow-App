/**
 * Wallet UI: connect button (opens wallet-adapter modal) or connected address menu.
 * Uses useWallet() from our WalletContext (adapter-backed) and useWalletModal() to open the modal.
 */
import { useState, useRef, useEffect } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '../contexts/WalletContext';
import { getPhantomBrowseUrl, isMobile } from '../lib/solana/phantomBrowse';
import styles from './WalletDropdown.module.css';

type Props = { className?: string };

export function WalletDropdown({ className }: Props) {
  const { walletPublicKey, disconnect, isLoading } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const mobile = isMobile();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const openModal = () => setVisible(true);

  const copyAddress = () => {
    if (walletPublicKey) {
      navigator.clipboard.writeText(walletPublicKey);
      setOpen(false);
    }
  };

  const handleSwitchWallet = () => {
    setOpen(false);
    disconnect();
    setTimeout(openModal, 100);
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
    <div className={[styles.wrap, className].filter(Boolean).join(' ')} ref={ref}>
      <div className={styles.connectRow}>
        <button
          type="button"
          className={styles.connectBtn}
          onClick={openModal}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting…' : 'Connect wallet'}
        </button>
      </div>
      {mobile && (
        <a
          href={getPhantomBrowseUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.phantomLink}
        >
          Or open in Phantom
        </a>
      )}
    </div>
  );
}
