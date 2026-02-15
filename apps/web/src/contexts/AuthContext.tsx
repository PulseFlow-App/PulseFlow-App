import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleAuthProvider, isFirebaseEnabled } from '../lib/firebase';

export type User = {
  userId: string;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  signIn: (email: string) => void;
  signInWithGoogle: () => Promise<void>;
  /** Redirect flow only (use if popup fails or is blocked). */
  signInWithGoogleRedirect: () => void;
  signOut: () => void;
  isGoogleAuth: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = '@pulse/auth_session';
const REFERRAL_CODE_KEY = '@pulse/referral_code';
const REFERRAL_WALLET_KEY = '@pulse/referral_wallet';

const API_BASE = (import.meta.env.VITE_API_URL as string)?.trim()?.replace(/\/$/, '') || '';

/** After a 500 from auth/sync, skip sync for this long to avoid spamming a failing API. */
const AUTH_SYNC_BACKOFF_MS = 3 * 60 * 1000;

function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

const TOKEN_KEY = '@pulse/access_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const lastSyncFailureAt = useRef<number>(0);

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User | null>(() => {
    if (isFirebaseEnabled()) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { user: User };
        if (data?.user?.userId && data?.user?.email) return data.user;
      }
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    if (!auth) return;
    let cancelled = false;
    getRedirectResult(auth)
      .then((credential) => {
        if (cancelled) return;
        if (credential?.user?.email) {
          const u = { userId: credential.user.uid, email: credential.user.email };
          setUser(u);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error('Google redirect sign-in error:', err);
      });
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser?.email) {
        const u = { userId: firebaseUser.uid, email: firebaseUser.email };
        setUser(u);
        if (API_BASE) {
          if (Date.now() - lastSyncFailureAt.current < AUTH_SYNC_BACKOFF_MS) {
            if (import.meta.env.DEV) console.warn('[auth/sync] Skipping (backoff after previous 500)');
            return;
          }
          fetch(`${API_BASE}/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: firebaseUser.email, userId: firebaseUser.uid }),
          })
            .then((r) => {
              if (r.status >= 500) lastSyncFailureAt.current = Date.now();
              return r.json().catch(() => ({}));
            })
            .then((data) => {
              if (data?.accessToken) {
                setAccessToken(data.accessToken);
                try { localStorage.setItem(TOKEN_KEY, data.accessToken); } catch { /* ignore */ }
              }
              if (!data?.ok && import.meta.env.DEV) console.warn('[auth/sync] Failed:', data);
            })
            .catch((e) => {
              lastSyncFailureAt.current = Date.now();
              if (import.meta.env.DEV) {
                console.warn('[auth/sync] Request failed:', e);
                if (e?.message === 'Failed to fetch' || e?.name === 'TypeError') {
                  console.warn('[auth/sync] Ensure the API is running (cd apps/api && npm run dev) and VITE_API_URL matches (default port is 3002).');
                }
              }
            });
        }
      } else {
        setUser(null);
        setAccessToken(null);
        try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const lastReferralFailureAt = useRef<number>(0);
  useEffect(() => {
    if (!user?.email || !API_BASE) return;
    const code = localStorage.getItem(REFERRAL_CODE_KEY)?.trim();
    if (!code) return;
    if (Date.now() - lastReferralFailureAt.current < AUTH_SYNC_BACKOFF_MS) return;
    const wallet = localStorage.getItem(REFERRAL_WALLET_KEY)?.trim() || undefined;
    fetch(`${API_BASE}/referrals/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrerCode: code, email: user.email, wallet }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok || res.status === 200) {
          try {
            localStorage.removeItem(REFERRAL_CODE_KEY);
            localStorage.removeItem(REFERRAL_WALLET_KEY);
          } catch {
            // ignore
          }
          return;
        }
        if (res.status >= 500) lastReferralFailureAt.current = Date.now();
        if (res.status === 400 && data?.code === 'REFERRER_NOT_FOUND') {
          if (import.meta.env.DEV) console.warn('[referrals/complete] Referrer not in DB yet:', data?.message);
        }
      })
      .catch(() => {
        lastReferralFailureAt.current = Date.now();
      });
  }, [user?.email]);

  const signIn = useCallback((email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    const u: User = { userId: generateUserId(), email: trimmed };
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u }));
    if (API_BASE && Date.now() - lastSyncFailureAt.current >= AUTH_SYNC_BACKOFF_MS) {
      fetch(`${API_BASE}/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, userId: u.userId }),
      })
        .then((r) => {
          if (r.status >= 500) lastSyncFailureAt.current = Date.now();
          return r.json().catch(() => ({}));
        })
        .then((data) => {
          if (data?.accessToken) {
            setAccessToken(data.accessToken);
            try { localStorage.setItem(TOKEN_KEY, data.accessToken); } catch { /* ignore */ }
          }
        })
        .catch((e) => {
          lastSyncFailureAt.current = Date.now();
          if (import.meta.env.DEV) console.warn('[auth/sync] Request failed:', e);
        });
    }
  }, []);

  const signInWithGoogle = useCallback((): Promise<void> => {
    if (!auth) return Promise.reject(new Error('Auth not configured'));
    // Try popup first (works more reliably when redirect/auth domain is misconfigured). Fallback to redirect if popup blocked.
    return signInWithPopup(auth, googleAuthProvider)
      .then((result) => {
        if (result?.user?.email) {
          const u = { userId: result.user.uid, email: result.user.email };
          setUser(u);
          if (API_BASE && Date.now() - lastSyncFailureAt.current >= AUTH_SYNC_BACKOFF_MS) {
            fetch(`${API_BASE}/auth/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: result.user.email, userId: result.user.uid }),
            })
              .then((r) => {
                if (r.status >= 500) lastSyncFailureAt.current = Date.now();
                return r.json().catch(() => ({}));
              })
              .then((data) => {
                if (data?.accessToken) {
                  setAccessToken(data.accessToken);
                  try { localStorage.setItem(TOKEN_KEY, data.accessToken); } catch { /* ignore */ }
                }
              })
              .catch(() => { lastSyncFailureAt.current = Date.now(); });
          }
        }
      })
      .catch((err) => {
        if (err?.code === 'auth/popup-blocked' && auth) {
          return signInWithRedirect(auth, googleAuthProvider) as Promise<void>;
        }
        if (import.meta.env.DEV) console.error('Google sign-in error:', err);
        const message = err?.message || err?.code || 'Sign-in failed';
        return Promise.reject(new Error(typeof message === 'string' ? message : 'Sign-in failed'));
      });
  }, []);

  const signInWithGoogleRedirect = useCallback(() => {
    if (!auth) return;
    signInWithRedirect(auth, googleAuthProvider).catch((err) => {
      if (import.meta.env.DEV) console.error('Google redirect sign-in error:', err);
    });
  }, []);

  const signOut = useCallback(() => {
    if (auth) {
      firebaseSignOut(auth).catch(() => {});
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEY);
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  }, []);

  const isGoogleAuth = isFirebaseEnabled();
  const value: AuthContextValue = {
    user,
    accessToken,
    signIn,
    signInWithGoogle,
    signInWithGoogleRedirect,
    signOut,
    isGoogleAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
