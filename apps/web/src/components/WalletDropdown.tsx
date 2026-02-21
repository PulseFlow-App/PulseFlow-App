import { useState, useRef, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getPhantomBrowseUrl, isMobile } from '../lib/solana/phantomBrowse';
import styles from './WalletDropdown.module.css';

type Props = {
  className?: string;
};

/**
 * Wallet menu in header: click to open dropdown with address, copy, disconnect, switch wallet.
 */
export function WalletDropdown({ className }: Props) {
  const { walletPublicKey, connect, disconnect, isWalletAvailable, isLoading, connectError } = useWallet();
  const [open, setOpen] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
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

  useEffect(() => {
    if (!showInstall) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowInstall(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showInstall]);

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
    <div className={[styles.wrap, className].filter(Boolean).join(' ')} ref={ref}>
      <div className={styles.connectRow}>
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
              {mobile && (
                <>
                  <span className={styles.installLabel}>Open Pulse in Phantom to connect</span>
                  <p className={styles.installHint}>
                    This will open the Phantom app with Pulse loaded so you can connect your wallet.
                  </p>
                  <a
                    href={getPhantomBrowseUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.installLinkPrimary}
                    role="menuitem"
                  >
                    Open in Phantom
                  </a>
                </>
              )}
              <span className={styles.installLabel}>{mobile ? 'Or install a wallet' : 'Install a Solana wallet'}</span>
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
      {connectError && (
        <p className={styles.connectError} role="alert">
          {connectError}
        </p>
      )}
    </div>
  );
}
