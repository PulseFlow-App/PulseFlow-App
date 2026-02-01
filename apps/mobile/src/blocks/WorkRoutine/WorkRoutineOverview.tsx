import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { ScoreRing } from '../../components/shared/ScoreRing';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { getCheckIns, getStreak, getWeeklyProgress } from './store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkRoutineOverview'>;

export function WorkRoutineOverview({ navigation }: Props) {
  const checkIns = getCheckIns();
  const streak = getStreak();
  const weekly = getWeeklyProgress();
  const total = checkIns.length;
  const pulseScore = total === 0 ? 0 : Math.min(100, 40 + total * 8 + streak * 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
        <Text style={styles.title}>Work Routine</Text>
        <Text style={styles.subtitle}>Check-ins & focus insights</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.scoreSection}>
          <ScoreRing score={pulseScore} label="Routine Pulse" size={120} />
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day streak</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>Total check-ins</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{weekly.percent}%</Text>
          <Text style={styles.statLabel}>This week</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('WorkRoutineCheckIn')}
      >
        <Text style={styles.buttonText}>Start Check-in</Text>
      </Pressable>

        <Pressable
          style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('WorkRoutineInsights')}
        >
          <Text style={styles.buttonSecondaryText}>View Insights</Text>
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
    paddingTop: 8,
    paddingBottom: 20,
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
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonPressed: { opacity: 0.85 },
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
});
