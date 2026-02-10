import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScoreRing } from '../../components/ScoreRing';
import { computeBodyPulse, computeBodyPulseAsync } from './store';
import type { BodyPulseSnapshot } from './types';
import styles from './BodySignals.module.css';

const TREND_SYMBOL: Record<string, string> = { up: '↑', down: '↓', stable: '→' };

export function BodySignalsResult() {
  const [pulse, setPulse] = useState<BodyPulseSnapshot>(() => computeBodyPulse());

  useEffect(() => {
    setPulse(computeBodyPulse());
    computeBodyPulseAsync().then(setPulse);
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
            <p className={styles.insight}>{pulse.insight}</p>
            {pulse.improvements.length > 0 && (
              <p className={styles.oneThing}>{pulse.improvements[0]}</p>
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
