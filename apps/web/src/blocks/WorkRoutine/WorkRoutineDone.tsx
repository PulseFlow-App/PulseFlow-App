import { Link } from 'react-router-dom';
import { ScoreRing } from '../../components/ScoreRing';
import { WhatNextSection } from '../../components/WhatNextSection';
import { WalletIndicator } from '../../components/WalletIndicator';
import { useWallet, useHasPulseLabAccess } from '../../contexts/WalletContext';
import { useOnChainDailyCheckIn } from '../../hooks/useOnChainDailyCheckIn';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getLatestCheckIn, getTodayRoutineScore } from './store';
import styles from './WorkRoutine.module.css';

export function WorkRoutineDone() {
  const { walletPublicKey, connect, isWalletAvailable, isLoading } = useWallet();
  const hasPulseLabAccess = useHasPulseLabAccess();
  const { hasActiveSubscription } = useSubscription();
  const { trigger, status, error, canCheckIn } = useOnChainDailyCheckIn();

  const latest = getLatestCheckIn();
  const isToday = latest && latest.timestamp.slice(0, 10) === new Date().toISOString().slice(0, 10);
  const score = getTodayRoutineScore();
  const analysis = isToday ? latest?.analysis : null;
  const pattern = analysis?.pattern ?? '';
  const shaping = analysis?.shaping ?? '';
  const oneThing = analysis?.oneThing ?? '';

  const shapingBullets = shaping
    ? shaping
        .split(/\n+/)
        .map((s) => s.replace(/^[•\-\s]+/, '').trim())
        .filter(Boolean)
    : [];

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
            Here’s your result from this block. Below: go to the main dashboard to add other blocks and get combined recommendations (2 or 3 blocks).
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.scoreSection}>
            <ScoreRing
              score={score ?? 0}
              label={score !== null ? 'Your Work Pulse' : 'No data yet'}
            />
          </div>
          {analysis && (
            <>
              {pattern && (
                <section className={styles.narrativeSection} aria-labelledby="work-pattern-heading">
                  <h2 id="work-pattern-heading" className={styles.narrativeHeading}>Today’s pattern</h2>
                  <p className={styles.narrativeText}>{pattern}</p>
                </section>
              )}
              {shapingBullets.length > 0 && (
                <section className={styles.narrativeSection} aria-labelledby="work-shaping-heading">
                  <h2 id="work-shaping-heading" className={styles.narrativeHeading}>What’s shaped your work signals</h2>
                  <ul className={styles.shapingList}>
                    {shapingBullets.map((line, i) => (
                      <li key={i} className={styles.shapingItem}>{line}</li>
                    ))}
                  </ul>
                </section>
              )}
              {oneThing && (
                <section className={styles.narrativeSection} aria-labelledby="work-one-heading">
                  <h2 id="work-one-heading" className={styles.narrativeHeading}>One thing to try</h2>
                  <p className={styles.narrativeText}>{oneThing}</p>
                </section>
              )}
              {!hasActiveSubscription && oneThing && (
                <section className={styles.narrativeSection} aria-labelledby="work-get-more-heading">
                  <h2 id="work-get-more-heading" className={styles.narrativeHeading}>Get more</h2>
                  <p className={styles.narrativeText}>
                    <strong>Upgrade to Premium</strong> for your second recommendation (a structured recovery pattern) based on your specific load and break data.
                  </p>
                </section>
              )}
            </>
          )}
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
                Connect wallet
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

        <WhatNextSection />
      </main>
    </div>
  );
}
