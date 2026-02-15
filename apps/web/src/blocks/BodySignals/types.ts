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
  /** Optional: appetite/hunger 1-5 (1 = low, 5 = very high) */
  appetite?: number;
  /** Optional: digestion/comfort 1-5 (1 = poor, 5 = great) */
  digestion?: number;
  notes?: string;
  photoUri?: string;
};

/** One factor that influences the score, and what it affects */
export type FactorImpact = {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  affects: string[];
  note?: string;
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
  /** What is affecting what (from API or rule-based) */
  factors?: FactorImpact[];
  /** When insights came from API vs rule-based fallback */
  insightsSource?: 'api' | 'rule-based';
  /** Reason AI was not used (when insightsSource is rule-based) */
  insightsError?: string;
  date: string;
};

export type TrendMetric = 'weight' | 'sleep' | 'energy' | 'hydration' | 'stress' | 'mood' | 'appetite' | 'digestion';
