import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScoreRing } from '../../components/ScoreRing';
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

export function BodySignalsOverview() {
  const [pulse, setPulse] = useState<BodyPulseSnapshot>(() => computeBodyPulse());
  const [loadingAI, setLoadingAI] = useState(false);

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
        <Link to="/dashboard" className={styles.back}>
          ← Dashboard
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Body Signals</h1>
          <p className={styles.subtitle}>Your body pulse today</p>
        </div>
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
              <div className={styles.improvementsBlock}>
                <p className={styles.aiLoading}>Getting your pattern…</p>
              </div>
            ) : pulse.insightsSource === 'api' ? (
              <div className={styles.narrativeBlock}>
                <section className={styles.narrativeSection} aria-labelledby="pattern-heading">
                  <h2 id="pattern-heading" className={styles.narrativeHeading}>Today&apos;s pattern</h2>
                  <p className={styles.insight}>{pulse.insight}</p>
                </section>
                <section className={styles.narrativeSection} aria-labelledby="why-heading">
                  <h2 id="why-heading" className={styles.narrativeHeading}>What&apos;s shaping your Pulse score today</h2>
                  <ExplanationWithIcons explanation={pulse.explanation} />
                </section>
                {pulse.improvements.length > 0 && (
                  <section className={styles.narrativeSection} aria-labelledby="one-thing-heading">
                    <h2 id="one-thing-heading" className={styles.narrativeHeading}>A small thing to observe or test</h2>
                    <p className={styles.oneThing}>{pulse.improvements[0]}</p>
                  </section>
                )}
              </div>
            ) : !loadingAI && (pulse.insightsSource === 'rule-based' || pulse.insightsSource === undefined) ? (
              <div className={styles.improvementsBlock}>
                <p className={styles.improvementsTitle}>AI didn&apos;t fetch.</p>
                <p className={styles.insightsError} role="status">
                  {pulse.insightsError || 'Connect the API to get personalized suggestions.'}
                </p>
              </div>
            ) : null}
          </div>
        </div>
        <Link to="/dashboard/body-signals/trends" className={styles.button}>
          View Trends
        </Link>
        <Link to="/dashboard/body-signals/log" className={styles.buttonSecondary}>
          Log Data
        </Link>
      </main>
    </div>
  );
}
