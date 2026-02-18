import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { AppFooter } from '../components/AppFooter';
import styles from './Login.module.css';

const REFERRAL_STORAGE_KEY = '@pulse/referral_code';

export function Login() {
  const [searchParams] = useSearchParams();
  const { user, signIn, signInWithGoogle, isGoogleAuth } = useAuth();
  const { walletPublicKey, connect, disconnect, isWalletAvailable, isLoading: walletLoading } = useWallet();
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

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      // Popup: we get here on success. Redirect: we usually navigate away before this.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Try again.');
    } finally {
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
          Sign in or connect your wallet to continue.
        </p>

        {/* Google */}
        {isGoogleAuth && (
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
        )}

        {isGoogleAuth && <p className={styles.divider}>or</p>}

        {/* Email */}
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
            autoFocus={!isGoogleAuth}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button}>
            Continue with email
          </button>
        </form>

        <p className={styles.divider}>or</p>

        {/* Wallet */}
        <div className={styles.walletBlock}>
          {walletPublicKey ? (
            <div className={styles.walletConnected}>
              <span className={styles.walletAddress} title={walletPublicKey}>
                {walletPublicKey.slice(0, 4)}…{walletPublicKey.slice(-4)}
              </span>
              <button type="button" onClick={disconnect} className={styles.walletDisconnect}>
                Disconnect
              </button>
            </div>
          ) : isWalletAvailable ? (
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={connect}
              disabled={walletLoading}
            >
              {walletLoading ? 'Connecting…' : 'Connect wallet'}
            </button>
          ) : (
            <a
              href="https://phantom.app/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.buttonSecondary}
            >
              Get Phantom wallet
            </a>
          )}
        </div>

        {!isGoogleAuth && (
          <p className={styles.hint}>
            Demo mode: no Firebase config. Add VITE_FIREBASE_* for Google sign-in.
          </p>
        )}
        <AppFooter />
      </main>
    </div>
  );
}
