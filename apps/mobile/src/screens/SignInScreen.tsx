import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { useAuth } from '../contexts/AuthContext';

export function SignInScreen() {
  const { signIn, signUp, signInWithMagic, isMagicEnabled } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={40}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Pulse</Text>
          <Text style={styles.subtitle}>
            {isMagicEnabled
              ? 'Sign in with email — we’ll send a one-time code. No password. You get a Solana wallet for premium.'
              : 'Sign in with email to use the app.'}
          </Text>
        </View>

        <View style={styles.form}>
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
        </View>
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
    paddingHorizontal: 24,
    justifyContent: 'center',
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
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.background,
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
});
