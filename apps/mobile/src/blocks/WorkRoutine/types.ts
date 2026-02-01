/**
 * Work Routine block - daily check-in, no wallet.
 * Equivalent to WRA flow without Celo/$INSIGHT.
 */

export type QuestionOption = {
  value: string;
  text: string;
  score: number;
};

export type Question = {
  id: number;
  question: string;
  category: string;
  options: QuestionOption[];
};

export type QuestionResponse = {
  questionId: number;
  selectedOption: string;
  score: number;
};

export type CheckInAnalysis = {
  assessment: string;
  quickWins: string[];
  recommendations?: string[];
};

export type CheckInEntry = {
  id: string;
  timestamp: string; // ISO
  responses: Record<string, QuestionResponse>;
  answers: Record<string, string>; // questionId -> option text
  analysis: CheckInAnalysis;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
};
