/**
 * Auth - Magic (email OTP + Solana wallet) and/or API email/password.
 * Session stored in AsyncStorage.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMagic } from './MagicContext';

const AUTH_STORAGE_KEY = '@pulse/auth_session';

export type User = {
  userId: string;
  email: string;
  /** Set when user signed in with Magic (Solana wallet) */
  walletAddress?: string | null;
};

type AuthState =
  | { status: 'guest' }
  | { status: 'loading' }
  | { status: 'signedIn'; user: User };

type AuthContextValue = {
  auth: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithMagic: (email: string) => Promise<void>;
  signInWithWallet: (walletAddress: string) => Promise<void>;
  updateWalletUserEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  isMagicEnabled: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function getApiUrl(): string | undefined {
  return typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL
    ? String(process.env.EXPO_PUBLIC_API_URL).replace(/\/$/, '')
    : undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { magic, isMagicEnabled } = useMagic();
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  const restoreSession = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw) as { user: User; token?: string; provider?: string };
        if (session?.user?.userId && session?.user?.email) {
          setAuth({ status: 'signedIn', user: session.user });
          return;
        }
      }
    } catch {
      // ignore
    }
    setAuth({ status: 'guest' });
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Refill Magic wallet address when session was restored without it (same wallet per user)
  useEffect(() => {
    if (auth.status !== 'signedIn' || !magic || auth.user.walletAddress) return;
    const user = auth.user;
    let cancelled = false;
    (async () => {
      try {
        const info = await magic.user.getInfo();
        const wallets = (info as { wallets?: { solana?: { publicAddress?: string } } }).wallets;
        const walletAddress = wallets?.solana?.publicAddress ?? null;
        if (cancelled || !walletAddress) return;
        const updatedUser: User = { ...user, walletAddress };
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const session = JSON.parse(raw) as { user: User; token?: string; provider?: string };
          session.user = updatedUser;
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        }
        setAuth({ status: 'signedIn', user: updatedUser });
      } catch {
        // not a Magic session or not logged in
      }
    })();
    return () => { cancelled = true; };
  }, [auth.status, auth.status === 'signedIn' ? auth.user?.userId : null, magic]);

  const signInWithMagic = useCallback(
    async (email: string) => {
      if (!magic) throw new Error('Magic is not configured');
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) throw new Error('Email is required');

      await magic.auth.loginWithEmailOTP({ email: trimmedEmail });
      const info = await magic.user.getInfo();
      const emailFromMagic = (info as { email?: string }).email ?? trimmedEmail;
      const wallets = (info as { wallets?: { solana?: { publicAddress?: string } } }).wallets;
      const walletAddress = wallets?.solana?.publicAddress ?? null;
      const issuer = (info as { issuer?: string }).issuer ?? '';
      const userId = issuer ? `magic_${issuer.replace(/^did:[^:]+:/, '').slice(0, 20)}` : generateUserId();

      const user: User = { userId, email: emailFromMagic, walletAddress };
      const session = { user, provider: 'magic' };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      setAuth({ status: 'signedIn', user });
    },
    [magic]
  );

  const signInWithWallet = useCallback(async (walletAddress: string) => {
    const trimmed = walletAddress.trim();
    if (!trimmed) throw new Error('Wallet address is required');
    // Solana addresses are base58, typically 32–44 chars
    if (trimmed.length < 32 || trimmed.length > 44) {
      throw new Error('Invalid Solana address length');
    }
    const userId = `wallet_${trimmed.slice(0, 8)}_${Date.now().toString(36)}`;
    const email = `${trimmed.slice(0, 6)}…@wallet.pulse`;
    const user: User = { userId, email, walletAddress: trimmed };
    const session = { user, provider: 'wallet' };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setAuth({ status: 'signedIn', user });
  }, []);

  const updateWalletUserEmail = useCallback(async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const session = JSON.parse(raw) as { user: User; provider?: string };
      if (session?.provider !== 'wallet' || !session?.user) return;
      const updatedUser: User = { ...session.user, email: trimmed };
      session.user = updatedUser;
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      setAuth((prev) =>
        prev.status === 'signedIn' ? { status: 'signedIn', user: updatedUser } : prev
      );
    } catch {
      // ignore
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const apiUrl = getApiUrl();
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) throw new Error('Email is required');

      if (apiUrl) {
        const res = await fetch(`${apiUrl}/auth/sign-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { message?: string }).message || 'Sign in failed');
        }
        const data = (await res.json()) as { user: User; accessToken: string };
        const session = { user: data.user, token: data.accessToken };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        setAuth({ status: 'signedIn', user: data.user });
        return;
      }

      const user: User = { userId: generateUserId(), email: trimmedEmail };
      const session = { user };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      setAuth({ status: 'signedIn', user });
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const apiUrl = getApiUrl();
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) throw new Error('Email is required');

      if (apiUrl) {
        const res = await fetch(`${apiUrl}/auth/sign-up`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { message?: string }).message || 'Sign up failed');
        }
        const data = (await res.json()) as { user: User; accessToken: string };
        const session = { user: data.user, token: data.accessToken };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        setAuth({ status: 'signedIn', user: data.user });
        return;
      }

      const user: User = { userId: generateUserId(), email: trimmedEmail };
      const session = { user };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      setAuth({ status: 'signedIn', user });
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw) as { provider?: string };
        if (session?.provider === 'magic' && magic) {
          await magic.user.logout();
        }
        // wallet provider: no external logout, just clear session
      }
    } catch {
      // ignore
    }
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth({ status: 'guest' });
  }, [magic]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw) as { token?: string };
        return session?.token ?? null;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  const value: AuthContextValue = {
    auth,
    signIn,
    signUp,
    signInWithMagic,
    signInWithWallet,
    updateWalletUserEmail,
    signOut,
    getAccessToken,
    isMagicEnabled,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
