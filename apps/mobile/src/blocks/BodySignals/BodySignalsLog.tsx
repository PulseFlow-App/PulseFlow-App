import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { addBodyLog } from './store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BodySignalsLog'>;

export function BodySignalsLog({ navigation }: Props) {
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState(3);
  const [hydration, setHydration] = useState(3);
  const [stress, setStress] = useState(3);
  const [weight, setWeight] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    addBodyLog({
      sleepHours,
      sleepQuality,
      energy,
      mood,
      hydration,
      stress,
      weight: weight ? parseFloat(weight) : undefined,
      notes: notes.trim() || undefined,
    });
    navigation.navigate('BodySignalsOverview');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Log Data</Text>
          <Text style={styles.subtitle}>One-tap submit</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sleep (hours)</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderValue}>{sleepHours}h</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={12}
              step={0.5}
              value={sleepHours}
              onValueChange={setSleepHours}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sleep quality (1–5)</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderValue}>{sleepQuality}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={sleepQuality}
              onValueChange={setSleepQuality}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Energy (1–5)</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderValue}>{energy}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={energy}
              onValueChange={setEnergy}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mood (1–5)</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderValue}>{mood}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={mood}
              onValueChange={setMood}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Hydration (1–5)</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderValue}>{hydration}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={hydration}
              onValueChange={setHydration}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Stress (1–5)</Text>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderValue}>{stress}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={stress}
              onValueChange={setStress}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="Optional"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Travel day, poor sleep, deadline stress — not diagnosed"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
          />
          <Text style={styles.hint}>Context only; notes influence suggestions cautiously.</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Photo (optional)</Text>
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoIcon}>📷</Text>
            <Text style={styles.photoTitle}>Add photo</Text>
            <Text style={styles.photoSub}>Scale, meal, or how you feel — coming soon</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Submit</Text>
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
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
  field: {
    marginBottom: 20,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    fontFamily: fonts.sans,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  photoPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  photoSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
    minWidth: 36,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.background,
  },
});
