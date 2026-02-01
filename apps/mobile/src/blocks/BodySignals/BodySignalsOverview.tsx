import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScoreRing } from '../../components/shared/ScoreRing';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { computeBodyPulse, computeBodyPulseAsync } from './store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BodySignalsOverview'>;

const TREND_SYMBOL = { up: '↑', down: '↓', stable: '→' } as const;

export function BodySignalsOverview({ navigation }: Props) {
  const [pulse, setPulse] = useState(() => computeBodyPulse());
  const [loadingAI, setLoadingAI] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setPulse(computeBodyPulse());
      setLoadingAI(true);
      computeBodyPulseAsync()
        .then(setPulse)
        .finally(() => setLoadingAI(false));
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Body Signals</Text>
        <Text style={styles.subtitle}>Your body pulse today</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.scoreSection}>
          <ScoreRing score={pulse.score} label="Body Pulse" />
          <View style={styles.trendRow}>
            <Text style={[styles.trendSymbol, styles[`trend_${pulse.trend}`]]}>
              {TREND_SYMBOL[pulse.trend]}
            </Text>
            <Text style={styles.trendLabel}>Today vs baseline</Text>
          </View>
          <Text style={styles.insight}>{pulse.insight}</Text>
          <Text style={styles.explanation}>{pulse.explanation}</Text>
          {loadingAI ? (
            <View style={styles.improvementsBlock}>
              <ActivityIndicator size="small" color={colors.blue} style={styles.aiLoading} />
              <Text style={styles.aiLoadingText}>Getting AI suggestions…</Text>
            </View>
          ) : pulse.improvements.length > 0 ? (
            <View style={styles.improvementsBlock}>
              <Text style={styles.improvementsTitle}>What to improve today</Text>
              {pulse.improvements.map((item, i) => (
                <Text key={i} style={styles.improvementItem}>
                  • {item}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('BodySignalsTrends')}
      >
        <Text style={styles.buttonText}>View Trends</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('BodySignalsLog')}
      >
        <Text style={styles.buttonSecondaryText}>Log Data</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 24,
  },
  scoreSection: {
    alignItems: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  trendSymbol: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 20,
  },
  trend_up: { color: colors.pulseHigh },
  trend_down: { color: colors.pulseLow },
  trend_stable: { color: colors.textSecondary },
  trendLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
  },
  insight: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
    maxWidth: 280,
  },
  explanation: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
    maxWidth: 280,
  },
  improvementsBlock: {
    marginTop: 20,
    alignSelf: 'stretch',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  aiLoading: {
    marginBottom: 8,
  },
  aiLoadingText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
  },
  improvementsTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  improvementItem: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.background,
  },
  buttonSecondaryText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
  },
});
