import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePremium } from '../contexts/PremiumContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'StakePremium'>;

const PULSE_LINK = 'https://pump.fun/coin/5ymQv4PBZDgECa4un7tYwXSVSWgFbfz79qg83dpppump';

export function StakePremiumScreen({ navigation }: Props) {
  const { openStakeScreen, setPremiumUnlocked } = usePremium();

  const handleStakeThenVerify = () => {
    openStakeScreen();
    // In production: user stakes in browser/wallet, returns to app, then "Connect wallet to show premium" verifies and unlocks.
    // For MVP demo: optionally show "I've staked" button that unlocks premium (or use dev build + real wallet check).
  };

  const handleIStaked = () => {
    setPremiumUnlocked(true);
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
        <Text style={styles.title}>Stake $PULSE for Premium</Text>
        <Text style={styles.subtitle}>
          Premium unlocks advanced trend tracking, personal baseline modeling, and unlimited AI requests.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.stepTitle}>1. Get $PULSE</Text>
        <Text style={styles.body}>
          $PULSE lives on Solana (Pump.fun). You can acquire it there, then stake to unlock Premium in Pulse.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.linkButton, pressed && styles.linkPressed]}
          onPress={() => openStakeScreen()}
        >
          <Text style={styles.linkText}>Open Pump.fun $PULSE →</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.stepTitle}>2. Stake to reach premium level</Text>
        <Text style={styles.body}>
          Stake the required amount of $PULSE at our staking site (or Streamflow / another Solana staking service). Once staked, connect your wallet in Profile to verify and unlock Premium.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleStakeThenVerify}
        >
          <Text style={styles.buttonText}>Go to staking</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.stepTitle}>3. Connect wallet in Profile</Text>
        <Text style={styles.body}>
          After staking, return here and tap "Connect wallet to show premium" on the Profile screen. We'll verify your stake and unlock Premium.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.buttonSecondaryText}>Open Profile</Text>
        </Pressable>
      </View>

        <Pressable
          style={({ pressed }) => [styles.demoButton, pressed && styles.linkPressed]}
          onPress={handleIStaked}
        >
          <Text style={styles.demoText}>I've staked - unlock Premium (demo)</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 12,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkPressed: { opacity: 0.8 },
  linkText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.blue,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.9 },
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
  demoButton: {
    marginTop: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textDim,
  },
});
