import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import styles from './Lab.module.css';

const REFERRAL_STORAGE_KEY = '@pulse/referral_code';

export function Lab() {
  const [searchParams] = useSearchParams();
  const { walletPublicKey, holdsPulse, connect, isWalletAvailable, isLoading } = useWallet();
  const hasAccess = !!walletPublicKey && !!holdsPulse;

  useEffect(() => {
    const ref = searchParams.get('ref')?.trim();
    if (ref) {
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, ref);
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>← Back</Link>
      </header>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>Pulse Lab</h1>
        {hasAccess ? (
          <p className={styles.placeholder}>Coming soon</p>
        ) : (
          <div className={styles.gate}>
            {!walletPublicKey ? (
              <>
                <p className={styles.gateText}>Connect your wallet to unlock Pulse Lab.</p>
                {isWalletAvailable ? (
                  <button
                    type="button"
                    className={styles.gateButton}
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
                    className={styles.gateButton}
                  >
                    Connect wallet
                  </a>
                )}
              </>
            ) : (
              <>
                <p className={styles.gateText}>
                  Hold $PULSE to unlock Pulse Lab: experiments, raw dashboards, and early access.
                </p>
                <a
                  href="https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.gateLink}
                >
                  Get $PULSE on Pump.fun →
                </a>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
