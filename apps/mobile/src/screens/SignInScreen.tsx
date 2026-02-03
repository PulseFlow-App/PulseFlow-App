import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { useAuth } from '../contexts/AuthContext';
import { useWalletConnect } from '../contexts/WalletConnectContext';

export function SignInScreen() {
  const { signIn, signUp, signInWithMagic, signInWithGoogle, signInWithWallet, isMagicEnabled } = useAuth();
  const { openPhantomConnect, isConnecting: isWalletConnecting, error: walletError, clearError: clearWalletError } = useWalletConnect();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setLoading(true);
    try {
      await signInWithMagic(email.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Magic sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) await signUp(email.trim(), password);
      else await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSubmit = async () => {
    setError(null);
    const trimmed = walletAddress.trim();
    if (!trimmed) {
      setError('Paste your wallet address');
      return;
    }
    setLoading(true);
    try {
      await signInWithWallet(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid wallet address');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPhantom = () => {
    clearWalletError();
    openPhantomConnect();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={40}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
          <Text style={styles.title}>Pulse</Text>
          <Text style={styles.subtitle}>
            Sign in with email or connect your Solana wallet (Phantom, Solflare, etc.).
          </Text>
        </View>

        <View style={styles.form}>
          {!useWallet ? (
            <>
          {isMagicEnabled && (
            <>
              <Pressable
                style={({ pressed }) => [styles.button, styles.buttonGoogle, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={styles.buttonGoogleText}>Sign in with Google</Text>
                )}
              </Pressable>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or with email</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(t) => { setEmail(t); setError(null); }}
            placeholder="you@example.com"
            placeholderTextColor={colors.textDim}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {isMagicEnabled && !usePassword && (
            <>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
                onPress={handleMagicSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.buttonText}>Send magic code</Text>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.switchButton, pressed && styles.switchPressed]}
                onPress={() => { setUsePassword(true); setError(null); }}
                disabled={loading}
              >
                <Text style={styles.switchText}>Or sign in with email & password</Text>
              </Pressable>
            </>
          )}

          {(usePassword || !isMagicEnabled) && (
            <>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(null); }}
                placeholder="••••••••"
                placeholderTextColor={colors.textDim}
                secureTextEntry
                editable={!loading}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
                onPress={handlePasswordSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.buttonText}>{isSignUp ? 'Create account' : 'Sign in'}</Text>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.switchButton, pressed && styles.switchPressed]}
                onPress={() => { setIsSignUp(!isSignUp); setError(null); }}
                disabled={loading}
              >
                <Text style={styles.switchText}>
                  {isSignUp ? 'Already have an account? Sign in' : 'No account? Create one'}
                </Text>
              </Pressable>
              {isMagicEnabled && (
              <Pressable
                style={({ pressed }) => [styles.switchButton, pressed && styles.switchPressed]}
                onPress={() => { setUsePassword(false); setError(null); }}
                disabled={loading}
              >
                <Text style={styles.switchText}>Back to magic code</Text>
              </Pressable>
              )}
            </>
          )}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          <Pressable
            style={({ pressed }) => [styles.switchButton, pressed && styles.switchPressed]}
            onPress={() => { setUseWallet(true); setError(null); setWalletAddress(''); }}
            disabled={loading}
          >
            <Text style={styles.switchText}>Connect with Solana wallet</Text>
          </Pressable>
            </>
          ) : (
            <>
          <Text style={styles.hintWallet}>
            Open Phantom and tap Connect, or paste your wallet address below.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, (loading || isWalletConnecting) && styles.buttonDisabled]}
            onPress={handleConnectPhantom}
            disabled={loading || isWalletConnecting}
          >
            {isWalletConnecting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.buttonText}>Connect with Phantom</Text>
            )}
          </Pressable>
          {walletError ? <Text style={styles.error}>{walletError}</Text> : null}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or paste address</Text>
            <View style={styles.dividerLine} />
          </View>
          <Text style={styles.label}>Wallet address</Text>
          <TextInput
            style={[styles.input, styles.walletInput]}
            value={walletAddress}
            onChangeText={(t) => { setWalletAddress(t); setError(null); }}
            placeholder="e.g. 7xKXtg2CW..."
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
            onPress={handleWalletSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonSecondaryText}>Continue with pasted address</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.switchButton, pressed && styles.switchPressed]}
            onPress={() => { setUseWallet(false); setError(null); clearWalletError(); }}
            disabled={loading}
          >
            <Text style={styles.switchText}>Back to email sign in</Text>
          </Pressable>
            </>
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  form: {},
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    fontFamily: fonts.sans,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.danger,
    marginTop: 12,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonGoogle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonGoogleText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
  },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.background,
  },
  buttonSecondary: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  switchPressed: { opacity: 0.8 },
  switchText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.blue,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
  },
  hintWallet: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
    lineHeight: 18,
  },
  walletInput: {
    fontFamily: fonts.sans,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  linkPressed: { opacity: 0.8 },
  linkText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.blue,
  },
});
