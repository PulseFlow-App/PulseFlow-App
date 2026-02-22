import { Link } from 'react-router-dom';
import { ScoreRing } from '../../components/ScoreRing';
import { getAllTimeRoutinePulse } from '../../stores/combinedPulse';
import styles from './WorkRoutine.module.css';

export function WorkRoutineOverview() {
  const pulse = getAllTimeRoutinePulse();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.back}>
          ← Dashboard
        </Link>
      </header>
      <main id="main" className={styles.main}>
        <div className={styles.blockHeader}>
          <h1 className={styles.title}>Work Routine</h1>
          <p className={styles.subtitle}>
            {pulse.hasData
              ? 'Your pulse from work check-ins'
              : 'Log check-ins to see your pulse'}
          </p>
        </div>
        <div className={styles.card}>
          <div className={styles.scoreSection}>
            <ScoreRing
              score={pulse.hasData ? pulse.score : 0}
              label={pulse.hasData ? 'All Time Work Routine Pulse' : 'No data yet'}
            />
          </div>
        </div>
        <Link to="/dashboard/work-routine/checkin" className={styles.button}>
          Log Data
        </Link>
        <Link to="/dashboard/work-routine/insights" className={styles.buttonSecondary}>
          View Trends
        </Link>
      </main>
    </div>
  );
}
