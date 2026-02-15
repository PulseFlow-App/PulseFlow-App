import type { Question } from './types';

export const WORK_ROUTINE_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'How many hours did you sleep last night?',
    category: 'sleep',
    options: [
      { value: 'A', text: 'Less than 5 hours', score: 1 },
      { value: 'B', text: '5-6 hours', score: 2 },
      { value: 'C', text: '7-8 hours', score: 3 },
      { value: 'D', text: 'More than 8 hours', score: 4 },
    ],
  },
  {
    id: 2,
    question: 'How would you rate your energy level right now?',
    category: 'energy',
    options: [
      { value: 'A', text: 'Very low', score: 1 },
      { value: 'B', text: 'Low', score: 2 },
      { value: 'C', text: 'Moderate', score: 3 },
      { value: 'D', text: 'High', score: 4 },
    ],
  },
  {
    id: 3,
    question: 'How many meals have you eaten today?',
    category: 'nutrition',
    options: [
      { value: 'A', text: '0-1 meals', score: 1 },
      { value: 'B', text: '2 meals', score: 2 },
      { value: 'C', text: '3 meals', score: 3 },
      { value: 'D', text: '4+ meals', score: 4 },
    ],
  },
  {
    id: 4,
    question: 'Did you exercise or move your body today?',
    category: 'activity',
    options: [
      { value: 'A', text: 'No movement', score: 1 },
      { value: 'B', text: 'Light walk (10-20 min)', score: 2 },
      { value: 'C', text: 'Moderate (30-45 min)', score: 3 },
      { value: 'D', text: 'Intense workout (60+ min)', score: 4 },
    ],
  },
  {
    id: 5,
    question: 'How would you rate your stress level today?',
    category: 'stress',
    options: [
      { value: 'A', text: 'Very high', score: 1 },
      { value: 'B', text: 'High', score: 2 },
      { value: 'C', text: 'Moderate', score: 3 },
      { value: 'D', text: 'Low', score: 4 },
    ],
  },
  {
    id: 6,
    question: 'How many focused work sessions did you complete today?',
    category: 'productivity',
    options: [
      { value: 'A', text: '0-1 sessions', score: 1 },
      { value: 'B', text: '2-3 sessions', score: 2 },
      { value: 'C', text: '4-5 sessions', score: 3 },
      { value: 'D', text: '6+ sessions', score: 4 },
    ],
  },
];
