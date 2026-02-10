import { Link } from 'react-router-dom';
import { ScoreRing } from '../../components/ScoreRing';
import { getCheckIns, getWeeklyProgress } from './store';
import styles from './WorkRoutine.module.css';

export function WorkRoutineOverview() {
  const checkIns = getCheckIns();
  const weekly = getWeeklyProgress();
  const total = checkIns.length;
  const pulseScore = total === 0 ? 0 : Math.min(100, 40 + total * 6 + weekly.percent * 0.3);

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
          <p className={styles.subtitle}>Work-day check-ins & insights</p>
        </div>
        <div className={styles.card}>
          <div className={styles.scoreSection}>
            <ScoreRing score={pulseScore} label="Routine Pulse" size={120} />
          </div>
        </div>
        <Link to="/dashboard/work-routine/checkin" className={styles.button}>
          Start Check-in
        </Link>
        <Link to="/dashboard/work-routine/insights" className={styles.buttonSecondary}>
          View Insights
        </Link>
      </main>
    </div>
  );
}
