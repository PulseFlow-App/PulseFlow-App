import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
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
  const { walletPublicKey, connect, disconnect, isWalletAvailable, isLoading } = useWallet();
  const [notificationsOn, setNotificationsOn] = useState(getNotificationsEnabled());
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | null>(null);

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

        <section className={styles.section} aria-labelledby="wallet-heading">
          <h2 id="wallet-heading" className={styles.sectionTitle}>Wallet</h2>
          <div className={styles.card}>
            {walletPublicKey ? (
              <>
                <p className={styles.label}>Connected</p>
                <p className={styles.value} style={{ wordBreak: 'break-all', fontSize: '0.875rem' }}>
                  {walletPublicKey.slice(0, 4)}…{walletPublicKey.slice(-4)}
                </p>
                <button type="button" onClick={disconnect} className={styles.walletBtn}>
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <p className={styles.muted}>Connect a Solana wallet for the full dashboard, leaderboard, and rewards.</p>
                {isWalletAvailable ? (
                  <button type="button" onClick={connect} disabled={isLoading} className={styles.walletBtn}>
                    {isLoading ? 'Connecting…' : 'Connect wallet'}
                  </button>
                ) : (
                  <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className={styles.walletBtn}>
                    Get Phantom
                  </a>
                )}
              </>
            )}
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

        <section className={styles.section}>
          <button type="button" onClick={signOut} className={styles.signOut}>
            Sign out
          </button>
        </section>
      </main>
    </div>
  );
}
