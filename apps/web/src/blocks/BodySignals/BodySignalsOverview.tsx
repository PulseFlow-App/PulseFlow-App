import { Link } from 'react-router-dom';
import { ScoreRing } from '../../components/ScoreRing';
import { getAggregatedPulse } from '../../stores/combinedPulse';
import styles from './BodySignals.module.css';

export function BodySignalsOverview() {
  const aggregated = getAggregatedPulse();

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
          <p className={styles.subtitle}>
            {aggregated.hasData
              ? 'Your pulse from body and work data'
              : 'Log body data and work check-ins to see your pulse'}
          </p>
        </div>
        <div className={styles.card}>
          <div className={styles.scoreSection}>
            <ScoreRing
              score={aggregated.hasData ? aggregated.score : 0}
              label={aggregated.hasData ? 'Aggregated Pulse' : 'No data yet'}
            />
          </div>
        </div>
        <Link to="/dashboard/body-signals/log" className={styles.button}>
          Log Data
        </Link>
        <Link to="/dashboard/body-signals/trends" className={styles.buttonSecondary}>
          View Trends
        </Link>
      </main>
    </div>
  );
}
