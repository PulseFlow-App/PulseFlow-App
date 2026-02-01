/**
 * Premium — optional wallet connect to show staked $PULSE and unlock premium.
 * Read-only chain check; no in-app trading.
 */
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Linking } from 'react-native';

const PULSE_PUMPFUN = 'https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump';
const STAKING_LINK = PULSE_PUMPFUN; // Replace with your staking UI when available

export type PremiumState = {
  isPremium: boolean;
  walletAddress: string | null;
  isConnecting: boolean;
  error: string | null;
};

type PremiumContextValue = PremiumState & {
  connectWallet: () => Promise<void>;
  checkPremiumStatus: (walletAddress: string) => Promise<boolean>;
  openStakeScreen: () => void;
  clearError: () => void;
  setPremiumUnlocked: (unlocked: boolean) => void;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PremiumState>({
    isPremium: false,
    walletAddress: null,
    isConnecting: false,
    error: null,
  });

  const checkPremiumStatus = useCallback(async (walletAddress: string): Promise<boolean> => {
    const apiUrl =
      typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL
        ? String(process.env.EXPO_PUBLIC_API_URL).replace(/\/$/, '')
        : undefined;
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}/premium/status?wallet=${encodeURIComponent(walletAddress)}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = (await res.json()) as { isPremium?: boolean };
          return Boolean(data.isPremium);
        }
      } catch {
        // fallback to mock
      }
    }
    // MVP mock: treat any connected wallet as premium after "stake" flow (user taps Connect → we open staking link; when they return we could re-check; for demo we allow setPremiumUnlocked)
    return false;
  }, []);

  const connectWallet = useCallback(async () => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      // MVP: open Phantom / WalletConnect via deep link. For dev build use Phantom SDK; for Expo Go use deep link to Phantom app or WalletConnect.
      const phantomUrl = 'https://phantom.app/ul/v1/connect';
      const canOpen = await Linking.canOpenURL(phantomUrl);
      if (canOpen) {
        await Linking.openURL(phantomUrl);
      }
      // In a real implementation: after wallet connects you get walletAddress, then:
      // const isPremium = await checkPremiumStatus(walletAddress);
      // setState({ isPremium, walletAddress, isConnecting: false, error: null });
      // For MVP we don't have wallet SDK in Expo Go; user goes to Stake screen and we simulate "premium unlocked" after they open staking link and return (or you use dev build + Phantom SDK).
      setState((s) => ({
        ...s,
        isConnecting: false,
        walletAddress: null,
        error: 'Wallet connect requires a development build. Open "Stake to reach premium" to learn more.',
      }));
    } catch (e) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: e instanceof Error ? e.message : 'Could not open wallet',
      }));
    }
  }, [checkPremiumStatus]);

  const openStakeScreen = useCallback(() => {
    Linking.openURL(STAKING_LINK).catch(() => {});
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const setPremiumUnlocked = useCallback((unlocked: boolean) => {
    setState((s) => ({ ...s, isPremium: unlocked, error: null }));
  }, []);

  const value: PremiumContextValue = {
    ...state,
    connectWallet,
    checkPremiumStatus,
    openStakeScreen,
    clearError,
    setPremiumUnlocked,
  };

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
}
