/**
 * About Pulse - policy-safe. No token gating, no staking in UI.
 * "Pulse is an app you can use every day. $PULSE is how the system evolves."
 */
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

const PULSEFLOW_SITE = 'https://pulseflow.site';

export function AboutPulseScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.title}>About Pulse</Text>
          <Text style={styles.body}>
            Pulse is an app you can use every day. Track body signals, check in on your routine, and get personalized insights.
          </Text>
          <Text style={styles.body}>
            You don't need crypto to use Pulse. Crypto is for those who want to help shape how the system evolves.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subtitle}>Community & updates</Text>
          <Pressable
            style={({ pressed }) => [styles.linkButton, pressed && styles.linkPressed]}
            onPress={() => Linking.openURL(PULSEFLOW_SITE)}
          >
            <Text style={styles.linkText}>Pulse website →</Text>
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
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
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
});
