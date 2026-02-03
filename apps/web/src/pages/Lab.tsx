import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styles from './Lab.module.css';

const REFERRAL_STORAGE_KEY = '@pulse/referral_code';

export function Lab() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref')?.trim();
    if (ref) {
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, ref);
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>← Back</Link>
      </header>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>Pulse Lab</h1>
        <p className={styles.placeholder}>Coming soon</p>
      </main>
    </div>
  );
}
