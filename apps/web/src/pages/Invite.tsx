import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from './Invite.module.css';

const REFERRAL_STORAGE_KEY = '@pulse/referral_code';
const APP_ORIGIN =
  typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://app.pulseflow.site';

export function Invite() {
  const { code } = useParams<{ code: string }>();

  useEffect(() => {
    if (code?.trim()) {
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, code.trim());
      } catch {
        // ignore
      }
    }
  }, [code]);

  return (
    <div className={styles.page}>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>You’re invited to Pulse Lab</h1>
        <p className={styles.subtitle}>
          A friend invited you. Complete the steps below so they receive their <strong>10,000 $PULSE</strong> bonus.
        </p>

        <section className={styles.section} aria-labelledby="flow-heading">
          <h2 id="flow-heading" className={styles.sectionTitle}>What you need to do</h2>
          <ol className={styles.steps}>
            <li>
              <strong>Connect a Solana wallet on the Lab page.</strong> Go to Pulse Lab and connect a compatible wallet (e.g. Phantom, Solflare). We’ve saved your invite code so we can link it when you’re done.
            </li>
            <li>
              <strong>Open the Pulse app and register with your email.</strong> Visit <a href={APP_ORIGIN} target="_blank" rel="noopener noreferrer">the Pulse app</a> and sign in with Google (or enter your email). That creates your account and completes the referral. Your friend gets their bonus.
            </li>
          </ol>
          <p className={styles.note}>
            Your friend gets <strong>10,000 $PULSE</strong> once we have you in our system with email (and optionally wallet from the Lab). No password needed if you use Google.
          </p>
        </section>

        <div className={styles.actions}>
          <Link to="/lab" className={styles.primaryButton}>
            Go to Pulse Lab (connect wallet)
          </Link>
          <a href={APP_ORIGIN} target="_blank" rel="noopener noreferrer" className={styles.secondaryButton}>
            Open app and register →
          </a>
        </div>

        <section className={styles.section} aria-labelledby="solana-heading">
          <h2 id="solana-heading" className={styles.sectionTitle}>What is a Solana wallet?</h2>
          <p className={styles.body}>
            A Solana wallet is an app or extension that holds your SOL (Solana’s native token) and other tokens like $PULSE. Popular options: <strong>Phantom</strong> and <strong>Solflare</strong>. You install them as a browser extension or mobile app, create a wallet, and then you can receive and send SOL and tokens.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="gas-heading">
          <h2 id="gas-heading" className={styles.sectionTitle}>What is gas?</h2>
          <p className={styles.body}>
            Gas is the small fee paid to the Solana network to process transactions (sending SOL, signing in, etc.). You pay it in SOL. You only need a tiny amount of SOL in your wallet to cover gas, usually less than a cent per transaction.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="deposit-heading">
          <h2 id="deposit-heading" className={styles.sectionTitle}>How do I get SOL into my wallet?</h2>
          <p className={styles.body}>
            After you create a wallet (e.g. Phantom or Solflare), you can get SOL by: (1) Buying it on an exchange (Coinbase, Kraken, etc.) and withdrawing it to your wallet address, or (2) Using a built-in “Buy” option in the wallet if available. Send the SOL to your wallet’s receive address. You only need a small amount for gas unless you’re also buying $PULSE or other tokens.
          </p>
        </section>

        <p className={styles.footer}>
          <Link to="/lab" className={styles.link}>Pulse Lab</Link>
          <span className={styles.sep}>·</span>
          <Link to="/" className={styles.link}>Pulse app</Link>
        </p>
      </main>
    </div>
  );
}
