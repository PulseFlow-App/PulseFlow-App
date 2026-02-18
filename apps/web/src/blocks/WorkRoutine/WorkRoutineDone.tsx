import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NextStepModal } from '../../components/NextStepModal';
import { WalletIndicator } from '../../components/WalletIndicator';
import { useWallet, useHasPulseLabAccess } from '../../contexts/WalletContext';
import { useOnChainDailyCheckIn } from '../../hooks/useOnChainDailyCheckIn';
import styles from './WorkRoutine.module.css';

export function WorkRoutineDone() {
  const [showModal, setShowModal] = useState(false);
  const { walletPublicKey, connect, isWalletAvailable, isLoading } = useWallet();
  const hasPulseLabAccess = useHasPulseLabAccess();
  const { trigger, status, error, canCheckIn } = useOnChainDailyCheckIn();

  useEffect(() => {
    const t = setTimeout(() => setShowModal(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.headerRow}>
        <Link to="/dashboard/work-routine" className={styles.back}>
          ← Work Routine
        </Link>
        <WalletIndicator compact />
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Check-in saved</h1>
          <p className={styles.subtitle}>
            Your work day is logged. See your Pulse score or add more blocks (Body Signals, Nutrition) for a stronger signal.
          </p>
        </div>

        <section className={styles.card} aria-label="On-chain rewards">
          <h2 className={styles.onChainTitle}>Earn on-chain points</h2>
          <p className={styles.onChainText}>
            Connect your wallet to earn points on-chain and redeem them for $PULSE. You can do one daily check-in per day.
          </p>
          {!walletPublicKey ? (
            isWalletAvailable ? (
              <button
                type="button"
                onClick={connect}
                disabled={isLoading}
                className={styles.onChainButton}
              >
                {isLoading ? 'Connecting…' : 'Connect wallet'}
              </button>
            ) : (
              <a
                href="https://phantom.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.onChainButton}
              >
                Get Phantom wallet
              </a>
            )
          ) : (
            <div className={styles.onChainActions}>
              <button
                type="button"
                onClick={() => trigger()}
                disabled={!canCheckIn || status === 'loading'}
                className={styles.onChainButton}
              >
                {status === 'loading' ? 'Signing…' : status === 'success' ? 'Done' : 'Daily check-in on-chain'}
              </button>
              {status === 'success' && (
                <span className={styles.onChainSuccess}>Points credited.</span>
              )}
              {status === 'error' && error && (
                <span className={styles.onChainError} role="alert">{error}</span>
              )}
            </div>
          )}
        </section>
        {walletPublicKey && !hasPulseLabAccess && (
          <section className={styles.card} aria-label="Pulse Lab">
            <h2 className={styles.onChainTitle}>Pulse Lab</h2>
            <p className={styles.onChainText}>
              Hold $PULSE to unlock Pulse Lab: experiments, raw dashboards, and early access.
            </p>
            <Link to="/lab" className={styles.onChainButton}>Unlock Pulse Lab</Link>
          </section>
        )}
      </main>
      <NextStepModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onDashboard={false}
      />
    </div>
  );
}
