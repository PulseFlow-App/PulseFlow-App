import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { AppFooter } from '../components/AppFooter';
import styles from './EmailOnlyReferral.module.css';

/**
 * Email-only users (no wallet): only referral links.
 * No dashboard, no points. Connect wallet to get full access.
 */
export function EmailOnlyReferral() {
  const { user, signOut } = useAuth();
  const { connect, isWalletAvailable, isLoading } = useWallet();

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
        <section className={styles.referralSection} aria-labelledby="referral-heading">
          <h2 id="referral-heading" className={styles.heading}>Referral links</h2>
          <p className={styles.muted}>Share Pulse with friends and earn when they join.</p>
          <Link to={user ? '/dashboard/invite' : '/invite'} className={styles.inviteLink}>
            Invite friends
          </Link>
        </section>

        <section className={styles.walletSection} aria-labelledby="wallet-cta-heading">
          <h2 id="wallet-cta-heading" className={styles.heading}>Get the full dashboard</h2>
          <p className={styles.muted}>
            Connect a wallet to get the Pulse dashboard, points, check-ins, and rewards.
          </p>
          {isWalletAvailable ? (
            <button
              type="button"
              className={styles.connectBtn}
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
              className={styles.connectBtn}
            >
              Get Phantom wallet
            </a>
          )}
        </section>

        <AppFooter />
      </main>
    </div>
  );
}
