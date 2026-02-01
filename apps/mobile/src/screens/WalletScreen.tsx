/**
 * Wallet menu: copy address, deposit SOL link (required for transactions).
 */
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

const HOW_TO_DEPOSIT_SOL_URL = 'https://solana.com/developers/guides/transfer-tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Wallet'>;

export function WalletScreen({}: Props) {
  const { auth } = useAuth();
  const [copied, setCopied] = useState(false);
  const user = auth.status === 'signedIn' ? auth.user : null;
  const address = user?.walletAddress ?? null;

  const handleCopy = async () => {
    if (!address) return;
    try {
      await Clipboard.setStringAsync(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Copy failed', 'Could not copy address.');
    }
  };

  const openDepositGuide = () => {
    Linking.openURL(HOW_TO_DEPOSIT_SOL_URL);
  };

  if (!address) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.noWalletTitle}>No wallet yet</Text>
            <Text style={styles.noWalletText}>
              Sign in with Magic (email + code) to get a Solana wallet. The same wallet is used every time you sign in with that email.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your wallet address</Text>
          <View style={styles.card}>
            <Text style={styles.address} selectable numberOfLines={2}>
              {address}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.copyButton, pressed && styles.buttonPressed]}
              onPress={handleCopy}
            >
              <Text style={styles.copyButtonText}>
                {copied ? 'Copied!' : 'Copy address'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deposit SOL</Text>
          <Text style={styles.hint}>
            You need SOL on this wallet to pay for transactions (e.g. staking, swapping). Send SOL to the address above from an exchange or another wallet.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.linkButton, pressed && styles.linkPressed]}
            onPress={openDepositGuide}
          >
            <Text style={styles.linkText}>
              How to deposit SOL on your wallet (required for transactions) →
            </Text>
          </Pressable>
        </View>
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
  section: {
    marginBottom: 28,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  address: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
  },
  copyButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.9 },
  copyButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.background,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 12,
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
  noWalletTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  noWalletText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
