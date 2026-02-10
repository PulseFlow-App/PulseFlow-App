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

export function BodySignalsResult() {
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
        <p className={styles.subtitle}>Here’s your result from today’s check-in.</p>

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
                    <h2 id="result-one-heading" className={styles.narrativeHeading}>A small thing to try</h2>
                    <p className={styles.oneThing}>{pulse.improvements[0]}</p>
                  </section>
                )}
                {!loadingAI && pulse.insightsError && (
                  <p className={styles.insightsError} role="status">
                    {pulse.insightsError}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <section className={styles.ctaSection} aria-labelledby="add-block-heading">
          <h2 id="add-block-heading" className={styles.ctaHeading}>
            Add Work Routine for your best Pulse
          </h2>
          <p className={styles.ctaText}>
            You logged body signals today. Adding how your work day went will give you a combined Pulse and clearer insights: focus, energy, and how they connect.
          </p>
          <div className={styles.ctaButtons}>
            <Link to="/dashboard/work-routine/checkin" className={styles.ctaPrimary}>
              Add Work Routine
            </Link>
            <Link to="/dashboard/pulse?from=body-signals" className={styles.ctaSecondary}>
              See full Pulse
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
