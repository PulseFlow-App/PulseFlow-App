import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { getLatestCheckIn, getCheckIns } from './store';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkRoutineInsights'>;

export function WorkRoutineInsights({ navigation }: Props) {
  const latest = getLatestCheckIn();
  const all = getCheckIns();

  if (all.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No insights yet</Text>
          <Text style={styles.emptyText}>
            Complete a check-in to see your assessment and quick wins.
          </Text>
          <Pressable onPress={() => navigation.navigate('WorkRoutineCheckIn')}>
            <Text style={styles.emptySub}>Start Check-in →</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Latest insight</Text>
          {latest && (
            <Text style={styles.date}>
              {new Date(latest.timestamp).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          )}
        </View>

        {latest && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Assessment</Text>
              <Text style={styles.cardText}>{latest.analysis.assessment}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Quick wins</Text>
              {latest.analysis.quickWins.map((win, i) => (
                <Text key={i} style={styles.bullet}>
                  • {win}
                </Text>
              ))}
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.hint}>
            Complete more check-ins to see patterns over time.
          </Text>
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
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
  date: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  bullet: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 4,
  },
  footer: {
    marginTop: 8,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
  },
  empty: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptySub: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.accent,
  },
});
