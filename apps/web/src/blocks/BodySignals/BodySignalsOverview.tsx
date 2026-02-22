import { Link } from 'react-router-dom';
import { ScoreRing } from '../../components/ScoreRing';
import { getAllTimeBodyPulse } from '../../stores/combinedPulse';
import styles from './BodySignals.module.css';

export function BodySignalsOverview() {
  const pulse = getAllTimeBodyPulse();

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
            {pulse.hasData
              ? 'Your pulse from body logs'
              : 'Log body data to see your pulse'}
          </p>
        </div>
        <div className={styles.card}>
          <div className={styles.scoreSection}>
            <ScoreRing
              score={pulse.hasData ? pulse.score : 0}
              label={pulse.hasData ? 'All Time Body Signals Pulse' : 'No data yet'}
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
