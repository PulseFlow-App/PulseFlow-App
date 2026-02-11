import { Link } from 'react-router-dom';
import { ScoreRing } from '../../components/ScoreRing';
import { getAggregatedPulse } from '../../stores/combinedPulse';
import styles from './WorkRoutine.module.css';

export function WorkRoutineOverview() {
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
          <h1 className={styles.title}>Work Routine</h1>
          <p className={styles.subtitle}>
            {aggregated.hasData
              ? `Aggregated from ${aggregated.bodyLogCount} body log${aggregated.bodyLogCount !== 1 ? 's' : ''} and ${aggregated.checkInCount} check-in${aggregated.checkInCount !== 1 ? 's' : ''}`
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
