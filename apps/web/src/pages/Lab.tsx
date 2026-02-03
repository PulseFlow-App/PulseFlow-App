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
        <p className={styles.underConstruction}>Under construction</p>
        <p className={styles.sub}>
          We’re building wallet connect, $PULSE staking verification, and Premium rewards here.
        </p>

        <section className={styles.section} aria-labelledby="wallet-heading">
          <h2 id="wallet-heading" className={styles.sectionTitle}>Connect wallet</h2>
          <p className={styles.body}>
            Connect a Solana-compatible wallet (e.g. Phantom, Solflare) to use the Lab. After connecting, you’ll be able to verify staked $PULSE and unlock Premium and advanced AI insights. Wallet connect UI will be added here next (see <code>docs/lab-wallet-connect.md</code> to enable <code>@solana/wallet-adapter-*</code>).
          </p>
        </section>

        <section className={styles.section} aria-labelledby="staking-heading">
          <h2 id="staking-heading" className={styles.sectionTitle}>Staking & Premium</h2>
          <p className={styles.body}>
            Staking verification will be added here: you’ll connect your wallet and either we’ll detect your staked $PULSE at our contract, or you’ll submit a lock/stream contract for verification. Once verified, we’ll mark you as Premium for the lock duration and enable advanced AI insights. If you “check” staking while signed in, we can associate your email with Premium and store it for the verified period.
          </p>
        </section>
      </main>
    </div>
  );
}
