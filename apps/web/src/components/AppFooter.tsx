import { Link } from 'react-router-dom';
import { useHasPulseLabAccess, useHasWallet } from '../contexts/WalletContext';
import { getFullAccessForTesting } from '../lib/featureFlags';
import styles from './AppFooter.module.css';

export function AppFooter() {
  const hasWallet = useHasWallet();
  const hasLabAccess = useHasPulseLabAccess();
  const fullAccessForTesting = getFullAccessForTesting();
  const showLabAsUnlocked = hasLabAccess || fullAccessForTesting;
  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="Legal and information">
        <Link to="/terms" className={styles.link}>Terms of Service</Link>
        <span className={styles.sep}>·</span>
        <Link to="/privacy" className={styles.link}>Privacy Policy</Link>
        <span className={styles.sep}>·</span>
        <Link to="/disclaimer" className={styles.link}>Disclaimer</Link>
        <span className={styles.sep}>·</span>
        <Link to="/lab" className={styles.link}>
          {showLabAsUnlocked ? 'Pulse Lab' : hasWallet ? 'Unlock Pulse Lab' : 'Join the ecosystem'}
        </Link>
      </nav>
      <p className={styles.copyright}>
        Pulse: your daily wellness and routine pulse. Not medical advice.
      </p>
    </footer>
  );
}
