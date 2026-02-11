import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './ShareInvite.module.css';

export function ShareInvite() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = user ? `${origin}/invite/${user.userId}` : '';

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.back}>← Dashboard</Link>
      </header>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>Invite friends</h1>
        <p className={styles.subtitle}>
          Share your link. When they sign up with that link, you earn <strong>100 referral points</strong> and they can join Pulse Lab.
        </p>
        <div className={styles.linkBox}>
          <code className={styles.linkText}>{inviteLink}</code>
          <button type="button" onClick={copyLink} className={styles.copyBtn}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
        <p className={styles.note}>
          Your friends open this link, then sign in with Google or email. We’ll link their account to yours and you’ll earn points for each referral.
        </p>
      </main>
    </div>
  );
}
