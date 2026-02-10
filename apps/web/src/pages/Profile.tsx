import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppStreak } from '../stores/appStreak';
import { getCheckIns, getWeeklyProgress } from '../blocks/WorkRoutine/store';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  requestNotificationPermission,
  startNotificationChecks,
  stopNotificationChecks,
} from '../stores/notifications';
import styles from './Profile.module.css';

export function Profile() {
  const { user, signOut } = useAuth();
  const [notificationsOn, setNotificationsOn] = useState(getNotificationsEnabled());
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | null>(null);

  const checkIns = getCheckIns();
  const streak = getAppStreak();
  const weekly = getWeeklyProgress();

  const handleNotificationsToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const perm = await requestNotificationPermission();
      setNotifyPermission(perm);
      if (perm === 'granted') {
        setNotificationsEnabled(true);
        setNotificationsOn(true);
        startNotificationChecks();
      }
    } else {
      setNotificationsEnabled(false);
      setNotificationsOn(false);
      stopNotificationChecks();
    }
  }, []);

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

        <section className={styles.section} aria-labelledby="notifications-heading">
          <h2 id="notifications-heading" className={styles.sectionTitle}>Notifications</h2>
          <div className={styles.card}>
            <p className={styles.label}>Daily reminders (9am & 9pm local time)</p>
            <p className={styles.muted}>
              Get a reminder to check in with Pulse at 9am and 9pm in your timezone. Works when the app is open or in background (browser permitting).
            </p>
            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={notificationsOn}
                onChange={(e) => handleNotificationsToggle(e.target.checked)}
                aria-describedby="notify-desc"
              />
              <span id="notify-desc">Enable 9am & 9pm reminders</span>
            </label>
            {notifyPermission === 'denied' && (
              <p className={styles.warning} role="alert">
                Notifications were blocked. Enable them in your browser settings for this site to get reminders.
              </p>
            )}
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
              <span className={styles.statLabel}>App streak (days)</span>
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
