/**
 * Body Signals block - data shapes.
 * Block 01 MVP: daily signals, non-medical insights only.
 */
export type BodyLogEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  weight?: number; // kg, optional
  sleepHours?: number;
  sleepQuality?: number; // 1–5 subjective
  energy?: number; // 1–5
  mood?: number; // 1–5
  hydration?: number; // 1–5 low→high
  stress?: number; // 1–5
  notes?: string; // contextual only; not diagnosed
  /** Placeholder for future: photo URI (meal, scale, mood). */
  photoUri?: string;
};

/** Daily evaluation: friction points for "what to improve". */
export type DailySignalsState = {
  sleepOk: boolean;
  energyOk: boolean;
  moodOk: boolean;
  hydrationOk: boolean;
  stressOk: boolean;
  sleepQualityOk: boolean;
  frictionPoints: string[]; // e.g. 'sleep', 'stress', 'hydration'
};

export type BodyPulseSnapshot = {
  score: number; // 0–100
  trend: 'up' | 'down' | 'stable';
  insight: string; // one-line
  explanation: string; // "Your Pulse Score is lower today mainly due to X and Y"
  improvements: string[]; // max 3, actionable suggestions
  date: string;
};

export type TrendMetric = 'weight' | 'sleep' | 'energy' | 'hydration' | 'stress' | 'mood';
