import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { PremiumSuccessModal } from '../components/shared/PremiumSuccessModal';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { auth, signOut } = useAuth();
  const {
    isPremium,
    isConnecting,
    error,
    connectWallet,
    clearError,
  } = usePremium();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const prevPremium = useRef(false);

  useEffect(() => {
    if (isPremium && !prevPremium.current) {
      setShowPremiumModal(true);
    }
    prevPremium.current = isPremium;
  }, [isPremium]);

  const user = auth.status === 'signedIn' ? auth.user : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {user ? (
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonPressed]}
          onPress={() => signOut()}
        >
          <Text style={styles.buttonSecondaryText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium</Text>
        {isPremium ? (
          <View style={styles.card}>
            <Text style={styles.premiumBadge}>Premium active</Text>
            <Text style={styles.hint}>Full features unlocked</Text>
          </View>
        ) : (
          <>
            <Text style={styles.hint}>
              Connect your Solana wallet to show that you have staked $PULSE. Then you can unlock premium.
            </Text>
            {error ? (
              <View style={styles.errorRow}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={clearError}><Text style={styles.dismiss}>Dismiss</Text></Pressable>
              </View>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isConnecting && styles.buttonDisabled]}
              onPress={connectWallet}
              disabled={isConnecting}
            >
              <Text style={styles.buttonText}>
                {isConnecting ? 'Connecting…' : 'Connect wallet to show premium'}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.linkButton, pressed && styles.linkPressed]}
              onPress={() => navigation.navigate('StakePremium')}
            >
              <Text style={styles.linkText}>Stake to reach premium →</Text>
            </Pressable>
          </>
        )}
      </View>

      <PremiumSuccessModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  value: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
  },
  premiumBadge: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.pulseHigh,
    marginBottom: 4,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.danger,
    flex: 1,
  },
  dismiss: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.blue,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonSecondaryText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkPressed: { opacity: 0.8 },
  linkText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.blue,
  },
});
