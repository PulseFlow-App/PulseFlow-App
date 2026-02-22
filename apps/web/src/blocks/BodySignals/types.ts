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

/** Aggregation handoff from block AI for Pulse synthesis (when 2+ blocks). */
export type AggregationHandoff = {
  block: string;
  primary_driver?: string;
  key_signals?: Record<string, unknown>;
  cross_block_flags?: string[];
  user_note_literal?: string;
  experiment?: string;
  confidence?: 'low' | 'medium' | 'high';
  [key: string]: unknown;
};

export type BodyPulseSnapshot = {
  score: number;
  trend: 'up' | 'down' | 'stable';
  insight: string;
  explanation: string;
  /** [0] = one free recommendation (everyone), [1] = second (Premium). See recommendation-tiers.md */
  improvements: string[];
  /** Root driver from AI (e.g. "sleep", "hydration"); used in premium gate when present */
  primary_driver?: string;
  /** What is affecting what (from API or rule-based) */
  factors?: FactorImpact[];
  /** When insights came from API vs rule-based fallback */
  insightsSource?: 'api' | 'rule-based';
  /** Reason AI was not used (when insightsSource is rule-based) */
  insightsError?: string;
  /** Passed to Pulse aggregation when 2+ blocks logged */
  aggregation_handoff?: AggregationHandoff | null;
  date: string;
};

export type TrendMetric = 'weight' | 'sleep' | 'energy' | 'hydration' | 'stress' | 'mood' | 'appetite' | 'digestion';
