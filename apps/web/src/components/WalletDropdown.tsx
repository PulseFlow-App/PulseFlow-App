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

  // No wallet extension: show "Connect wallet" that expands to install / open-in-app options
  const [showInstall, setShowInstall] = useState(false);
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  useEffect(() => {
    if (!showInstall) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowInstall(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showInstall]);

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')} ref={ref}>
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
        <>
          <button
            type="button"
            className={styles.connectBtn}
            onClick={() => setShowInstall((v) => !v)}
            aria-expanded={showInstall}
            aria-haspopup="true"
          >
            Connect wallet
          </button>
          {showInstall && (
            <div className={styles.installMenu} role="menu">
              {isMobile && (
                <>
                  <span className={styles.installLabel}>On mobile: open this site in Phantom</span>
                  <p className={styles.installHint}>
                    In Phantom, tap Menu → Browser, then go to this site to connect.
                  </p>
                  <a
                    href="https://phantom.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.installLinkPrimary}
                    role="menuitem"
                  >
                    Open Phantom
                  </a>
                </>
              )}
              <span className={styles.installLabel}>{isMobile ? 'Or install a wallet' : 'Install a Solana wallet'}</span>
              <a
                href="https://phantom.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.installLink}
                role="menuitem"
              >
                Phantom
              </a>
              <a
                href="https://solflare.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.installLink}
                role="menuitem"
              >
                Solflare
              </a>
              <a
                href="https://backpack.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.installLink}
                role="menuitem"
              >
                Backpack
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
