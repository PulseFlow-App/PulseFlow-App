/**
 * Body Signals block - data shapes (aligned with mobile).
 */
export type BodyLogEntry = {
  id: string;
  date: string;
  weight?: number;
  sleepHours?: number;
  sleepQuality?: number;
  energy?: number;
  mood?: number;
  hydration?: number;
  stress?: number;
  notes?: string;
  photoUri?: string;
};

export type DailySignalsState = {
  sleepOk: boolean;
  energyOk: boolean;
  moodOk: boolean;
  hydrationOk: boolean;
  stressOk: boolean;
  sleepQualityOk: boolean;
  frictionPoints: string[];
};

export type BodyPulseSnapshot = {
  score: number;
  trend: 'up' | 'down' | 'stable';
  insight: string;
  explanation: string;
  improvements: string[];
  date: string;
};

export type TrendMetric = 'weight' | 'sleep' | 'energy' | 'hydration' | 'stress' | 'mood';
