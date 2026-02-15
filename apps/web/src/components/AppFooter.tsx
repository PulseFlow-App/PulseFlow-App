import { Link } from 'react-router-dom';
import styles from './AppFooter.module.css';

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="Legal and information">
        <Link to="/terms" className={styles.link}>Terms of Service</Link>
        <span className={styles.sep}>·</span>
        <Link to="/privacy" className={styles.link}>Privacy Policy</Link>
        <span className={styles.sep}>·</span>
        <Link to="/disclaimer" className={styles.link}>Disclaimer</Link>
        <span className={styles.sep}>·</span>
        <Link to="/lab" className={styles.link}>Join the ecosystem</Link>
      </nav>
      <p className={styles.copyright}>
        Pulse: your daily wellness and routine pulse. Not medical advice.
      </p>
    </footer>
  );
}
