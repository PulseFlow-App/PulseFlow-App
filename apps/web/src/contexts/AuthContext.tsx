import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type User = {
  userId: string;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  signIn: (email: string, password: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('@pulse/auth_session');
      if (raw) {
        const data = JSON.parse(raw) as { user: User };
        if (data?.user?.userId && data?.user?.email) return data.user;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const signIn = useCallback((email: string, _password: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    const u: User = { userId: generateUserId(), email: trimmed };
    setUser(u);
    localStorage.setItem('@pulse/auth_session', JSON.stringify({ user: u }));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem('@pulse/auth_session');
  }, []);

  const value: AuthContextValue = { user, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
