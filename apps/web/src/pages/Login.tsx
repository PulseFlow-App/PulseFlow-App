import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppFooter } from '../components/AppFooter';
import { magic, isMagicEnabled } from '../lib/magic';
import styles from './Login.module.css';

export function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email is required');
      return;
    }
    signIn(trimmed, password);
    navigate('/dashboard', { replace: true });
  };

  const handleGoogleLogin = async () => {
    if (!magic) return;
    setError(null);
    try {
      await magic.oauth2.loginWithRedirect({
        provider: 'google',
        redirectURI: `${window.location.origin}/callback`,
      });
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Sign-in failed. Try again.');
    }
  };

  return (
    <div className={styles.page}>
      <main id="main" className={styles.main}>
        <img src="/icons/icon-192.png?v=2" alt="Pulse" className={styles.logo} />
        <h1 className={styles.title}>Pulse</h1>
        <p className={styles.subtitle}>
          Sign in with email. Your daily wellness and routine pulse.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label} htmlFor="email">
            Email
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

          <label className={styles.label} htmlFor="password">
            Password (optional for demo)
          </label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {error && <p className={styles.error}>{error}</p>}

          {isMagicEnabled() && (
            <>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={handleGoogleLogin}
              >
                Sign in with Google
              </button>
              <p className={styles.divider}>or</p>
            </>
          )}

          <button type="submit" className={styles.button}>
            Sign in
          </button>
        </form>

        <p className={styles.hint}>
          This is the web app. Use the same API or Magic when you connect the backend.
        </p>
        <AppFooter />
      </main>
    </div>
  );
}
