import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScoreRing } from '../../components/ScoreRing';
import { computeBodyPulse } from './store';
import type { BodyPulseSnapshot } from './types';
import styles from './BodySignals.module.css';

const TREND_SYMBOL: Record<string, string> = { up: '↑', down: '↓', stable: '→' };

export function BodySignalsOverview() {
  const [pulse, setPulse] = useState<BodyPulseSnapshot>(() => computeBodyPulse());

  useEffect(() => {
    setPulse(computeBodyPulse());
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
            <p className={styles.insight}>{pulse.insight}</p>
            <p className={styles.explanation}>{pulse.explanation}</p>
            {pulse.improvements.length > 0 && (
              <div className={styles.improvementsBlock}>
                <p className={styles.improvementsTitle}>What to improve today</p>
                <ul className={styles.improvementsList}>
                  {pulse.improvements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
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
