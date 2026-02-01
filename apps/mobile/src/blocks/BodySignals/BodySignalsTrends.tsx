import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { LineChart } from '../../components/shared/LineChart';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { getLogsForRange } from './store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import type { TrendMetric } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'BodySignalsTrends'>;

const RANGES = [7, 30] as const;
const METRICS: { key: TrendMetric; label: string }[] = [
  { key: 'sleep', label: 'Sleep' },
  { key: 'energy', label: 'Energy' },
  { key: 'mood', label: 'Mood' },
  { key: 'hydration', label: 'Hydration' },
  { key: 'stress', label: 'Stress' },
  { key: 'weight', label: 'Weight' },
];

export function BodySignalsTrends({ navigation }: Props) {
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [metric, setMetric] = useState<TrendMetric>('sleep');

  const logs = useMemo(() => getLogsForRange(rangeDays), [rangeDays]);
  const chartData = useMemo(() => {
    const out: { x: number; y: number; label?: string }[] = [];
    for (const l of logs) {
      let y: number | undefined;
      if (metric === 'weight') y = l.weight;
      else if (metric === 'sleep') y = l.sleepHours;
      else if (metric === 'energy') y = l.energy;
      else if (metric === 'mood') y = l.mood;
      else if (metric === 'hydration') y = l.hydration;
      else if (metric === 'stress') y = l.stress;
      if (y != null) out.push({ x: 0, y, label: l.date.slice(5) });
    }
    return out;
  }, [logs, metric]);

  const is1to5 = metric === 'energy' || metric === 'mood' || metric === 'hydration' || metric === 'stress';
  const correlationHint =
    logs.length >= 2 && metric === 'energy'
      ? 'Low sleep → low energy'
      : metric === 'stress'
        ? 'High stress can affect sleep and mood'
        : metric === 'sleep'
          ? 'Aim for 7–9 hours'
          : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Trends</Text>
        <Text style={styles.subtitle}>Body Signals over time</Text>
      </View>

      <View style={styles.rangeRow}>
        {RANGES.map((d) => (
          <Pressable
            key={d}
            style={[styles.rangeChip, rangeDays === d && styles.rangeChipActive]}
            onPress={() => setRangeDays(d)}
          >
            <Text style={[styles.rangeChipText, rangeDays === d && styles.rangeChipTextActive]}>
              {d}d
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.metricRow}>
        {METRICS.map((m) => (
          <Pressable
            key={m.key}
            style={[styles.metricChip, metric === m.key && styles.metricChipActive]}
            onPress={() => setMetric(m.key)}
          >
            <Text style={[styles.metricChipText, metric === m.key && styles.metricChipTextActive]}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.chartCard}>
        <LineChart
          data={chartData}
          yMin={is1to5 ? 1 : undefined}
          yMax={is1to5 ? 5 : undefined}
        />
      </View>

      {correlationHint ? (
        <Text style={styles.hint}>{correlationHint}</Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('BodySignalsLog')}
      >
        <Text style={styles.buttonText}>Log Data</Text>
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
    paddingBottom: 16,
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
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  rangeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangeChipActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  rangeChipText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  rangeChipTextActive: {
    color: colors.accent,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricChipActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accent,
  },
  metricChipText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  metricChipTextActive: {
    color: colors.text,
  },
  chartCard: {
    marginBottom: 16,
    minHeight: 140,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.background,
  },
});
