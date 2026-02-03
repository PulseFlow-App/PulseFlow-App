/**
 * Magic - email OTP, Google OAuth, and Solana embedded wallet.
 * When EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY is set, provides Magic instance and Relayer for login.
 */
import React, { createContext, useMemo, useContext } from 'react';
import { Magic } from '@magic-sdk/react-native-expo';
import { SolanaExtension } from '@magic-ext/solana';
import { OAuthExtension } from '@magic-ext/react-native-expo-oauth';
import { colors } from '../theme/colors';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

function getMagicPublishableKey(): string | undefined {
  const key =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY
      ? String(process.env.EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY).trim()
      : undefined;
  return key || undefined;
}

type MagicContextValue = {
  magic: Magic | null;
  isMagicEnabled: boolean;
};

const MagicContext = createContext<MagicContextValue | null>(null);

export function MagicProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => {
    const apiKey = getMagicPublishableKey();
    if (!apiKey) {
      return { magic: null, isMagicEnabled: false };
    }
    const magic = new Magic(apiKey, {
      extensions: [
        new SolanaExtension({ rpcUrl: SOLANA_RPC }),
        new OAuthExtension(),
      ],
    });
    return { magic, isMagicEnabled: true };
  }, []);

  return (
    <MagicContext.Provider value={value as MagicContextValue}>
      {value.magic ? (
        <value.magic.Relayer backgroundColor={colors.background} />
      ) : null}
      {children}
    </MagicContext.Provider>
  );
}

export function useMagic(): MagicContextValue {
  const ctx = useContext(MagicContext);
  // Allow use outside provider for optional Magic (returns disabled state)
  if (!ctx) return { magic: null, isMagicEnabled: false };
  return ctx;
}
