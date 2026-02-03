import { Link } from 'react-router-dom';
import styles from './LegalPage.module.css';

const PULSE_PUMPFUN = 'https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump';

const LOCKING_URL =
  typeof import.meta !== 'undefined' &&
  typeof import.meta.env?.VITE_LOCKING_URL === 'string' &&
  import.meta.env.VITE_LOCKING_URL.trim()
    ? import.meta.env.VITE_LOCKING_URL.trim().replace(/\/$/, '')
    : '';

export function Lab() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>← Back</Link>
      </header>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>Pulse Lab</h1>
        <p className={styles.updated}>
          $PULSE, where to buy, and how to lock. Use the Pulse app to connect your wallet and verify after locking.
        </p>
        <div className={styles.content}>
          <h2>What is $PULSE?</h2>
          <p>
            Pulse is an app you can use every day. <strong>$PULSE</strong> is how the system evolves. The token lives on Solana and is used for governance, protocol credits, and access to experiments (like this Lab). You don’t need crypto to use the app; Premium is available via in-app subscription. $PULSE is for people who want to shape the roadmap and take part in the ecosystem.
          </p>

          <h2>Where to buy $PULSE</h2>
          <p>
            $PULSE is on Solana via Pump.fun. You can acquire it there, then lock it to unlock Premium or participate in governance.
          </p>
          <p>
            <a href={PULSE_PUMPFUN} target="_blank" rel="noopener noreferrer">
              Buy $PULSE on Pump.fun →
            </a>
          </p>

          <h2>How to lock $PULSE for Premium</h2>
          <p>
            You lock your tokens for <strong>as long as you want to use the paid tier</strong>. Lock for 1 month → Premium for 1 month; lock for 1 year → Premium for 1 year. Locking happens outside the app: get $PULSE, then lock the required amount at our locking site (or a Solana lock service) for the duration you choose. After locking, open the Pulse app, connect your wallet, and we’ll verify your lock and unlock Premium for that period.
          </p>
          {LOCKING_URL ? (
            <p>
              <a href={LOCKING_URL} target="_blank" rel="noopener noreferrer">
                Go to lock $PULSE →
              </a>
            </p>
          ) : (
            <p>
              <em>Locking URL will be available soon. Set VITE_LOCKING_URL in the web app to show your locking link here.</em>
            </p>
          )}

          <h2>Connect in the app</h2>
          <p>
            Sign in to the Pulse app (this web PWA or a future client) and connect your wallet when available to verify your lock and unlock Premium. This web app is the same project; you can sign in here and use the Lab from any device.
          </p>
          <p>
            <Link to="/">Open Pulse app</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
