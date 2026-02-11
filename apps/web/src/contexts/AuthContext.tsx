import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
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
  signInWithGoogle: () => void;
  signOut: () => void;
  isGoogleAuth: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = '@pulse/auth_session';
const REFERRAL_CODE_KEY = '@pulse/referral_code';
const REFERRAL_WALLET_KEY = '@pulse/referral_wallet';

const API_BASE = (import.meta.env.VITE_API_URL as string)?.trim()?.replace(/\/$/, '') || '';

function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

const TOKEN_KEY = '@pulse/access_token';

export function AuthProvider({ children }: { children: ReactNode }) {
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
          fetch(`${API_BASE}/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: firebaseUser.email, userId: firebaseUser.uid }),
          })
            .then((r) => r.json().catch(() => ({})))
            .then((data) => {
              if (data?.accessToken) {
                setAccessToken(data.accessToken);
                try { localStorage.setItem(TOKEN_KEY, data.accessToken); } catch { /* ignore */ }
              }
              if (!data?.ok && import.meta.env.DEV) console.warn('[auth/sync] Failed:', data);
            })
            .catch((e) => { if (import.meta.env.DEV) console.warn('[auth/sync] Request failed:', e); });
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

  useEffect(() => {
    if (!user?.email || !API_BASE) return;
    const code = localStorage.getItem(REFERRAL_CODE_KEY)?.trim();
    if (!code) return;
    const wallet = localStorage.getItem(REFERRAL_WALLET_KEY)?.trim() || undefined;
    fetch(`${API_BASE}/referrals/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referrerCode: code, email: user.email, wallet }),
    })
      .then(() => {
        try {
          localStorage.removeItem(REFERRAL_CODE_KEY);
          localStorage.removeItem(REFERRAL_WALLET_KEY);
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // ignore; can retry later or leave code for next session
      });
  }, [user?.email]);

  const signIn = useCallback((email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    const u: User = { userId: generateUserId(), email: trimmed };
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u }));
    if (API_BASE) {
      fetch(`${API_BASE}/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, userId: u.userId }),
      })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (data?.accessToken) {
            setAccessToken(data.accessToken);
            try { localStorage.setItem(TOKEN_KEY, data.accessToken); } catch { /* ignore */ }
          }
        })
        .catch((e) => { if (import.meta.env.DEV) console.warn('[auth/sync] Request failed:', e); });
    }
  }, []);

  const signInWithGoogle = useCallback(() => {
    if (!auth) return;
    signInWithPopup(auth, googleAuthProvider)
      .then((result) => {
        if (result?.user?.email) {
          const u = { userId: result.user.uid, email: result.user.email };
          setUser(u);
          if (API_BASE) {
            fetch(`${API_BASE}/auth/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: result.user.email, userId: result.user.uid }),
            })
              .then((r) => r.json().catch(() => ({})))
              .then((data) => {
                if (data?.accessToken) {
                  setAccessToken(data.accessToken);
                  try { localStorage.setItem(TOKEN_KEY, data.accessToken); } catch { /* ignore */ }
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error('Google sign-in error:', err);
        if (err?.code === 'auth/popup-blocked' && auth) {
          signInWithRedirect(auth, googleAuthProvider);
        }
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
