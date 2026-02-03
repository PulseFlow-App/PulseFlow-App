import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { magic } from '../lib/magic';
import styles from './Login.module.css';

export function Callback() {
  const navigate = useNavigate();
  const { signInWithMagic } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!magic) {
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;

    magic.oauth2
      .getRedirectResult()
      .then((result) => {
        if (cancelled) return;
        const email =
          result.magic?.userMetadata?.email ??
          (result.oauth as { userInfo?: { email?: string } } | undefined)?.userInfo?.email ??
          '';
        const metadata = result.magic?.userMetadata as { publicAddress?: string } | undefined;
        const userId = metadata?.publicAddress ?? undefined;
        if (email) {
          signInWithMagic(email, userId);
          navigate('/dashboard', { replace: true });
        } else {
          setError('Could not get email from sign-in.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Magic OAuth redirect error:', err);
        setError(err?.message ?? 'Sign-in failed. Try again.');
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, signInWithMagic]);

  if (error) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p className={styles.error}>{error}</p>
          <button
            type="button"
            className={styles.button}
            onClick={() => navigate('/', { replace: true })}
          >
            Back to sign in
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p className={styles.subtitle}>Completing sign-in…</p>
      </main>
    </div>
  );
}
