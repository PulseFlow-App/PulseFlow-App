import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { WORK_ROUTINE_QUESTIONS } from './questions';
import { addCheckIn } from './store';
import type { Question, QuestionResponse } from './types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkRoutineCheckIn'>;

export function WorkRoutineCheckIn({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});

  const question = WORK_ROUTINE_QUESTIONS[currentIndex];
  const isLast = currentIndex === WORK_ROUTINE_QUESTIONS.length - 1;
  const progress = ((currentIndex + 1) / WORK_ROUTINE_QUESTIONS.length) * 100;

  const handleSelect = (q: Question, optionValue: string, optionText: string, score: number) => {
    setResponses((prev) => ({
      ...prev,
      [q.id.toString()]: { questionId: q.id, selectedOption: optionValue, score },
    }));
  };

  const handleNext = () => {
    if (!question || !responses[question.id.toString()]) return;
    if (isLast) {
      const answers: Record<string, string> = {};
      WORK_ROUTINE_QUESTIONS.forEach((q) => {
        const r = responses[q.id.toString()];
        if (r) {
          const opt = q.options.find((o) => o.value === r.selectedOption);
          answers[q.id.toString()] = opt?.text ?? r.selectedOption;
        }
      });
      addCheckIn(responses, answers);
      navigation.replace('WorkRoutineOverview');
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (!question) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.step}>
          Question {currentIndex + 1} of {WORK_ROUTINE_QUESTIONS.length}
        </Text>
        <Text style={styles.questionText}>{question.question}</Text>
        <View style={styles.options}>
          {question.options.map((opt) => {
            const selected = responses[question.id.toString()]?.selectedOption === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => handleSelect(question, opt.value, opt.text, opt.score)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {opt.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            !responses[question.id.toString()] && styles.nextButtonDisabled,
            pressed && responses[question.id.toString()] && styles.buttonPressed,
          ]}
          onPress={handleNext}
          disabled={!responses[question.id.toString()]}
        >
          <Text
            style={[
              styles.nextButtonText,
              !responses[question.id.toString()] && styles.nextButtonTextDisabled,
            ]}
          >
            {isLast ? 'Complete Check-in' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  step: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  questionText: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  option: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceElevated,
  },
  optionText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
  },
  optionTextSelected: {
    fontFamily: fonts.sansSemiBold,
    color: colors.accent,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.7,
  },
  nextButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.background,
  },
  nextButtonTextDisabled: {
    color: colors.textMuted,
  },
  buttonPressed: { opacity: 0.85 },
});
