import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScoreRing } from '../../components/ScoreRing';
import { WhatNextSection } from '../../components/WhatNextSection';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useHasWallet } from '../../contexts/WalletContext';
import { computeBodyPulse, computeBodyPulseAsync } from './store';
import { getExplanationBullets, SignalIcon } from './signalIcons';
import type { BodyPulseSnapshot } from './types';
import styles from './BodySignals.module.css';

const TREND_SYMBOL: Record<string, string> = { up: '↑', down: '↓', stable: '→' };

function ExplanationWithIcons({ explanation }: { explanation: string }) {
  const bullets = getExplanationBullets(explanation);
  if (bullets.length === 0) {
    return <p className={styles.explanation}>{explanation}</p>;
  }
  return (
    <ul className={styles.explanationList} aria-label="What affects your score">
      {bullets.map(({ icon, text }, i) => (
        <li key={i} className={styles.explanationItem}>
          <SignalIcon icon={icon} className={styles.explanationIcon} />
          <span className={styles.explanationText}>{text}</span>
        </li>
      ))}
    </ul>
  );
}

export function BodySignalsResult() {
  const { hasActiveSubscription } = useSubscription();
  const hasWallet = useHasWallet();
  const [pulse, setPulse] = useState<BodyPulseSnapshot>(() => computeBodyPulse());
  const [loadingAI, setLoadingAI] = useState(true);

  useEffect(() => {
    setPulse(computeBodyPulse());
    setLoadingAI(true);
    computeBodyPulseAsync()
      .then(setPulse)
      .finally(() => setLoadingAI(false));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard/body-signals" className={styles.back}>
          ← Body Signals
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>Your Body Pulse</h1>
        <p className={styles.subtitle}>
          Here’s your result from this block. Below: what next. Go to the main dashboard to add other blocks and get combined recommendations.
        </p>

        <div className={styles.card}>
          <div className={styles.scoreSection}>
            <ScoreRing score={pulse.score} label="Body Pulse" />
            <div className={styles.trendRow}>
              <span className={styles[`trend_${pulse.trend}`]}>
                {TREND_SYMBOL[pulse.trend]}
              </span>
              <span className={styles.trendLabel}>Today vs baseline</span>
            </div>
            {loadingAI ? (
              <p className={styles.aiLoading}>Getting your pattern…</p>
            ) : (
              <>
                <section className={styles.narrativeSection} aria-labelledby="result-pattern-heading">
                  <h2 id="result-pattern-heading" className={styles.narrativeHeading}>Today’s pattern</h2>
                  <p className={styles.insight}>{pulse.insight}</p>
                </section>
                {pulse.explanation && (
                  <section className={styles.narrativeSection} aria-labelledby="result-why-heading">
                    <h2 id="result-why-heading" className={styles.narrativeHeading}>What’s shaping your Pulse</h2>
                    <ExplanationWithIcons explanation={pulse.explanation} />
                  </section>
                )}
                {pulse.improvements.length > 0 && (
                  <section className={styles.narrativeSection} aria-labelledby="result-one-heading">
                    <h2 id="result-one-heading" className={styles.narrativeHeading}>How to improve</h2>
                    <p className={styles.oneThing}>{pulse.improvements[0]}</p>
                  </section>
                )}
                {hasActiveSubscription && pulse.improvements.length > 1 && (
                  <section className={styles.narrativeSection} aria-labelledby="result-advanced-heading">
                    <h2 id="result-advanced-heading" className={styles.narrativeHeading}>Another angle (advanced)</h2>
                    <p className={styles.oneThing}>{pulse.improvements[1]}</p>
                  </section>
                )}
                {!hasActiveSubscription && !loadingAI && (
                  <section className={styles.narrativeSection} aria-labelledby="result-subscription-cta-heading">
                    <h2 id="result-subscription-cta-heading" className={styles.narrativeHeading}>Get more</h2>
                    <p className={styles.insight}>
                      <strong>Upgrade to Premium</strong> for advanced recommendations (a second lever tailored to your signals).
                      {!hasWallet && ' Connect your wallet for on-chain points and rewards.'}
                    </p>
                  </section>
                )}
              </>
            )}
          </div>
        </div>

        <WhatNextSection />
      </main>
    </div>
  );
}
