import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { getAppStreak } from '../stores/appStreak';
import { getBodyLogs } from '../blocks/BodySignals/store';
import { getCheckIns } from '../blocks/WorkRoutine/store';
import { AppFooter } from '../components/AppFooter';
import styles from './Dashboard.module.css';

/**
 * Minimal dashboard for Google-only users (no wallet).
 * No full block grid, no leaderboard. Single focus: Pulse + check-in.
 */
export function SimpleDashboard() {
  const { user, signOut } = useAuth();
  const { connect, isWalletAvailable, isLoading, walletPublicKey } = useWallet();
  const streak = getAppStreak();
  const checkInsCount = getBodyLogs().length + getCheckIns().length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <img src="/icons/icon-192.png?v=2" alt="" className={styles.logoImg} />
          <h1 className={styles.logo}>Pulse</h1>
        </div>
        <nav className={styles.nav}>
          <Link to="/dashboard/profile" className={styles.profileLink}>
            {user?.email}
          </Link>
          <button type="button" onClick={signOut} className={styles.profileBtn}>
            Sign out
          </button>
        </nav>
      </header>

      <main id="main" className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.heroLine1}>No noise.</p>
          <p className={styles.heroLine2}>Just signal.</p>
          <Link to="/dashboard/pulse" className={styles.pulseLink}>
            See your Pulse
          </Link>
        </section>

        <section className={styles.statsStrip} aria-label="Your stats">
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{streak}</span>
            <span className={styles.statLabel}>Day streak</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{checkInsCount}</span>
            <span className={styles.statLabel}>Check-ins</span>
          </div>
        </section>

        <div className={styles.inviteRow}>
          <Link to={user ? '/dashboard/invite' : '/invite'} className={styles.inviteLink}>
            Invite friends
          </Link>
        </div>

        {!walletPublicKey && (
          <section className={styles.section} aria-label="Unlock more">
            <div className={styles.upgradeCard}>
              <h2 className={styles.upgradeTitle}>Unlock full Pulse</h2>
              <p className={styles.upgradeText}>
                Connect your wallet to get the full dashboard, leaderboard, on-chain points, and rewards.
              </p>
              {isWalletAvailable ? (
                <button
                  type="button"
                  className={styles.upgradeButton}
                  onClick={connect}
                  disabled={isLoading}
                >
                  {isLoading ? 'Connecting…' : 'Connect wallet'}
                </button>
              ) : (
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.upgradeButton}
                >
                  Get Phantom wallet
                </a>
              )}
            </div>
          </section>
        )}

        <AppFooter />
      </main>
    </div>
  );
}
