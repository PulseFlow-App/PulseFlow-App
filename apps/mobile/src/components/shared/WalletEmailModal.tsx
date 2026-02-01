/**
 * Modal shown after signing in with wallet: offer to add email (optional).
 * Skip or Save; once dismissed we don't show again (stored in AsyncStorage).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const WALLET_EMAIL_MODAL_DISMISSED_KEY = '@pulse/wallet_email_modal_dismissed';

function isWalletPlaceholderEmail(email: string): boolean {
  return email.endsWith('@wallet.pulse');
}

export function WalletEmailModal() {
  const { auth, updateWalletUserEmail } = useAuth();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (auth.status !== 'signedIn' || !auth.user) return;
      const user = auth.user;
      if (!isWalletPlaceholderEmail(user.email)) return;
      try {
        const dismissed = await AsyncStorage.getItem(WALLET_EMAIL_MODAL_DISMISSED_KEY);
        if (!cancelled && dismissed !== '1') setVisible(true);
      } catch {
        if (!cancelled) setVisible(true);
      }
    })();
    return () => { cancelled = true; };
  }, [auth.status, auth.status === 'signedIn' ? auth.user?.email : null]);

  const dismiss = useCallback(async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(WALLET_EMAIL_MODAL_DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  const handleSkip = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const handleSave = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    setSaving(true);
    try {
      if (trimmed) await updateWalletUserEmail(trimmed);
      await dismiss();
    } finally {
      setSaving(false);
    }
  }, [email, updateWalletUserEmail, dismiss]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Add your email (optional)</Text>
          <Text style={styles.subtitle}>
            We'll use it for account recovery and updates. You can skip.
          </Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textDim}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
          />
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [styles.buttonSecondary, pressed && styles.pressed]}
              onPress={handleSkip}
              disabled={saving}
            >
              <Text style={styles.buttonSecondaryText}>Skip</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.pressed, saving && styles.disabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    fontFamily: fonts.sans,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    minWidth: 90,
    alignItems: 'center',
  },
  buttonSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.7 },
  buttonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.background,
  },
  buttonSecondaryText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.text,
  },
});
