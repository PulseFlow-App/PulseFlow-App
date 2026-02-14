import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Invite.module.css';

const REFERRAL_STORAGE_KEY = '@pulse/referral_code';

export function Invite() {
  const { code } = useParams<{ code: string }>();
  const { user, signInWithGoogle, isGoogleAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (code?.trim()) {
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, code.trim());
      } catch {
        // ignore (Safari can restrict storage when opened from external link)
      }
    }
  }, [code]);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  if (user) return null;

  const handleSignInWithGoogle = () => {
    // Code is already stored in localStorage by useEffect; start sign-in so user actually logs in.
    signInWithGoogle();
  };

  return (
    <div className={styles.page}>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>You’ve been invited</h1>
        <p className={styles.subtitle}>
          A friend invited you to Pulse. Sign in to get started.
        </p>

        {isGoogleAuth ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSignInWithGoogle}
          >
            Sign in with Google
          </button>
        ) : (
          <Link to={code?.trim() ? `/?invite=${encodeURIComponent(code.trim())}` : '/'} className={styles.primaryButton}>
            Go to Pulse and sign in
          </Link>
        )}
      </main>
    </div>
  );
}
