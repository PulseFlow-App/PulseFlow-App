import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCheckIns, getStreak, getWeeklyProgress } from '../blocks/WorkRoutine/store';
import styles from './Profile.module.css';

export function Profile() {
  const { user, signOut } = useAuth();
  const checkIns = getCheckIns();
  const streak = getStreak();
  const weekly = getWeeklyProgress();

  if (!user) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.back}>← Dashboard</Link>
      </header>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>Profile</h1>

        <section className={styles.section} aria-labelledby="account-heading">
          <h2 id="account-heading" className={styles.sectionTitle}>Account</h2>
          <div className={styles.card}>
            <p className={styles.label}>Email</p>
            <p className={styles.value}>{user.email}</p>
            <p className={styles.muted}>User ID: {user.userId}</p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="stats-heading">
          <h2 id="stats-heading" className={styles.sectionTitle}>Check-in statistics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{checkIns.length}</span>
              <span className={styles.statLabel}>Total check-ins</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{streak}</span>
              <span className={styles.statLabel}>Current streak (days)</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{weekly.count}/7</span>
              <span className={styles.statLabel}>This week</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{weekly.percent}%</span>
              <span className={styles.statLabel}>Weekly consistency</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <button type="button" onClick={signOut} className={styles.signOut}>
            Sign out
          </button>
        </section>
      </main>
    </div>
  );
}
