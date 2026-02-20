/**
 * Subscription status (fiat: Stripe/IAP). Gates advanced recommendations.
 * See docs/fiat-subscription-integration.md and recommendation-tiers.md.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../lib/apiUrl';

type SubscriptionContextValue = {
  /** True when user has an active paid subscription (from GET /subscription/status). */
  hasActiveSubscription: boolean;
  /** True while loading subscription status (only when logged in and API configured). */
  isLoading: boolean;
  /** Re-fetch subscription status (e.g. after returning from payment). */
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    const apiBase = getApiUrl();
    if (!user || !accessToken || !apiBase) {
      setHasActiveSubscription(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/subscription/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { hasActiveSubscription?: boolean };
        setHasActiveSubscription(Boolean(data?.hasActiveSubscription));
      } else {
        setHasActiveSubscription(false);
      }
    } catch {
      setHasActiveSubscription(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const refresh = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  const value: SubscriptionContextValue = {
    hasActiveSubscription,
    isLoading,
    refresh,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    return {
      hasActiveSubscription: false,
      isLoading: false,
      refresh: async () => {},
    };
  }
  return ctx;
}
