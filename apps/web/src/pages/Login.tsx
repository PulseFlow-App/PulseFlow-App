import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppFooter } from '../components/AppFooter';
import styles from './Login.module.css';

const REFERRAL_STORAGE_KEY = '@pulse/referral_code';

export function Login() {
  const [searchParams] = useSearchParams();
  const { user, signIn, signInWithGoogle, isGoogleAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Safari: referral code in URL survives OAuth redirect when localStorage doesn't. Store it so AuthContext can complete referral.
  useEffect(() => {
    const invite = searchParams.get('invite')?.trim();
    if (invite) {
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, invite);
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleGoogleLogin = () => {
    setError(null);
    setLoading(true);
    try {
      signInWithGoogle();
      // Redirect flow: page will navigate to Google, then back here. No await.
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Sign-in failed. Try again.');
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email is required');
      return;
    }
    signIn(trimmed);
    // Redirect happens via "if (user) return <Navigate to=/dashboard />" after state updates
  };

  return (
    <div className={styles.page}>
      <main id="main" className={styles.main}>
        <img src="/icons/icon-192.png?v=2" alt="Pulse" className={styles.logo} />
        <h1 className={styles.title}>Pulse</h1>
        <p className={styles.subtitle}>
          {isGoogleAuth
            ? 'Sign in with Google. No password needed.'
            : 'Your daily wellness and routine pulse.'}
        </p>

        {isGoogleAuth ? (
          <>
            <button
              type="button"
              className={styles.button}
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in with Google'}
            </button>
            {error && <p className={styles.error}>{error}</p>}
          </>
        ) : (
          <form onSubmit={handleEmailSubmit} className={styles.form}>
            <label className={styles.label} htmlFor="email">
              Email (demo)
            </label>
            <input
              id="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button}>
              Continue
            </button>
          </form>
        )}

        <p className={styles.hint}>
          {isGoogleAuth
            ? 'You’ll be redirected to Google and back. We use Google only to sign you in; we don’t post or access your data elsewhere.'
            : 'Demo mode: no Firebase config. Add VITE_FIREBASE_* for Google sign-in.'}
        </p>
        {isGoogleAuth && (
          <details className={styles.troubleshoot}>
            <summary>Having trouble signing in?</summary>
            <ul className={styles.troubleshootList}>
              <li><strong>Safari:</strong> Allow pop-ups for this site (Safari → Settings → Websites → Pop-up Windows). To test, you can turn off "Prevent cross-site tracking" in Privacy.</li>
              <li><strong>Chrome:</strong> Allow third-party cookies for this site (Settings → Privacy and security → Cookies).</li>
              <li><strong>URL:</strong> Open the app using the correct address (e.g. the link you were given). Don't use a different bookmark or copy of the link.</li>
            </ul>
          </details>
        )}
        <AppFooter />
      </main>
    </div>
  );
}
