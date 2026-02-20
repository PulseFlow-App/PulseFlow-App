import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Dashboard } from '../pages/Dashboard';
import { AppFooter } from './AppFooter';
import { WalletDropdown } from './WalletDropdown';
import styles from '../pages/Dashboard.module.css';

/**
 * Logged-in users with a connected wallet see the full dashboard.
 * Without a wallet, they see a gate: connect wallet to unlock the dashboard.
 */
export function DashboardGate() {
  const { user, signOut } = useAuth();
  const { walletPublicKey } = useWallet();

  if (!walletPublicKey) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.logoWrap}>
            <img src="/icons/icon-192.png?v=2" alt="" className={styles.logoImg} />
            <h1 className={styles.logo}>Pulse</h1>
          </div>
          <nav className={styles.nav}>
            <WalletDropdown className={styles.headerWallet} />
            <Link to="/dashboard/profile" className={styles.profileLink}>
              {user?.email}
            </Link>
            <button type="button" onClick={signOut} className={styles.profileBtn}>
              Sign out
            </button>
          </nav>
        </header>
        <main id="main" className={styles.main}>
          <section className={styles.walletRecommend} aria-label="Connect wallet">
            <div className={styles.walletRecommendCard}>
              <p className={styles.walletRecommendTitle}>Connect your wallet to see your dashboard</p>
              <p className={styles.walletRecommendText}>
                Your dashboard, points, check-ins, and on-chain rewards are available once you connect a Solana wallet (Phantom, Solflare, or any compatible wallet).
              </p>
              <WalletDropdown />
            </div>
          </section>
          <AppFooter />
        </main>
      </div>
    );
  }

  return <Dashboard />;
}
