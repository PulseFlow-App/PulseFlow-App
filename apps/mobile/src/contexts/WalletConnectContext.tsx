/**
 * Phantom connect: open wallet → user taps Connect → redirect back with encrypted session.
 * Decrypts response and calls signInWithWallet(public_key).
 * Keypair is persisted so decrypt works after app is reopened from redirect (e.g. after kill).
 * Must be used inside AuthProvider.
 */
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import {
  buildConnectUrl,
  createKeyPair,
  decryptConnectResponse,
  getParamsFromRedirectUrl,
  isWalletConnectRedirect,
  type PhantomKeyPair,
} from '../utils/phantomConnect';
import bs58 from 'bs58';

const PHANTOM_KEYPAIR_KEY = '@pulse/phantom_connect_keypair';

function keyPairToStorage(kp: PhantomKeyPair): string {
  return JSON.stringify({
    publicKey: Array.from(kp.publicKey),
    secretKey: Array.from(kp.secretKey),
  });
}

function keyPairFromStorage(raw: string): PhantomKeyPair | null {
  try {
    const { publicKey, secretKey } = JSON.parse(raw) as { publicKey: number[]; secretKey: number[] };
    return {
      publicKey: new Uint8Array(publicKey),
      secretKey: new Uint8Array(secretKey),
    };
  } catch {
    return null;
  }
}

type WalletConnectContextValue = {
  openPhantomConnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
  clearError: () => void;
};

const WalletConnectContext = React.createContext<WalletConnectContextValue | null>(null);

export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  const { signInWithWallet } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  const handleUrl = useCallback(
    async (url: string) => {
      if (!isWalletConnectRedirect(url)) return;
      const params = getParamsFromRedirectUrl(url);
      if (!params) return;

      const errorCode = params.get('errorCode');
      const errorMessage = params.get('errorMessage');
      if (errorCode || errorMessage) {
        setError(errorMessage || errorCode || 'Connection failed');
        setIsConnecting(false);
        return;
      }

      const data = params.get('data');
      const nonce = params.get('nonce');
      const phantomPublicKey = params.get('phantom_encryption_public_key');
      if (!data || !nonce || !phantomPublicKey) {
        setError('Invalid redirect from Phantom');
        setIsConnecting(false);
        return;
      }

      try {
        const raw = await AsyncStorage.getItem(PHANTOM_KEYPAIR_KEY);
        const keyPair = raw ? keyPairFromStorage(raw) : null;
        await AsyncStorage.removeItem(PHANTOM_KEYPAIR_KEY);
        if (!keyPair) {
          setError('Connection expired. Try again.');
          setIsConnecting(false);
          return;
        }
        const { public_key } = decryptConnectResponse(
          data,
          nonce,
          phantomPublicKey,
          keyPair.secretKey
        );
        await signInWithWallet(public_key);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not connect wallet');
      } finally {
        setIsConnecting(false);
      }
    },
    [signInWithWallet]
  );

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener('url', (e) => handleUrl(e.url));
    return () => sub.remove();
  }, [handleUrl]);

  const openPhantomConnect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const keyPair = createKeyPair();
      await AsyncStorage.setItem(PHANTOM_KEYPAIR_KEY, keyPairToStorage(keyPair));
      const dappPublicKeyBase58 = bs58.encode(keyPair.publicKey);
      const url = buildConnectUrl(dappPublicKeyBase58);
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        await AsyncStorage.removeItem(PHANTOM_KEYPAIR_KEY);
        setError('Cannot open Phantom. Install Phantom app.');
        setIsConnecting(false);
        return;
      }
      await Linking.openURL(url);
      // User will switch to Phantom; when they approve, app reopens with pulse:// URL
      // isConnecting stays true until handleUrl runs
    } catch (e) {
      await AsyncStorage.removeItem(PHANTOM_KEYPAIR_KEY).catch(() => {});
      setError(e instanceof Error ? e.message : 'Could not open Phantom');
      setIsConnecting(false);
    }
  }, []);

  const value: WalletConnectContextValue = {
    openPhantomConnect,
    isConnecting,
    error,
    clearError,
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect(): WalletConnectContextValue {
  const ctx = useContext(WalletConnectContext);
  if (!ctx) throw new Error('useWalletConnect must be used within WalletConnectProvider');
  return ctx;
}
