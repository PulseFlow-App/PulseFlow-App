/**
 * Body Signals - Block 01.
 * MVP uses AI for insight, explanation, and improvements (max 3).
 * Pulse Score stays deterministic (never AI-generated).
 * Fallback: rule-based generateInsights when AI is unavailable or fails.
 */
import { fetchAIInsights } from './aiInsights';
import type { BodyLogEntry, BodyPulseSnapshot, DailySignalsState } from './types';

const STORAGE_KEY = '@pulse/body_logs';
const MAX_IMPROVEMENTS = 3;

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

let logs: BodyLogEntry[] = [];

export function getBodyLogs(): BodyLogEntry[] {
  return [...logs].sort((a, b) => b.date.localeCompare(a.date));
}

export function addBodyLog(entry: Omit<BodyLogEntry, 'id' | 'date'>): BodyLogEntry {
  const newEntry: BodyLogEntry = {
    ...entry,
    id: generateId(),
    date: getToday(),
  };
  logs = [newEntry, ...logs];
  return newEntry;
}

/**
 * Evaluate daily signals into state and friction points.
 * Used to drive "what to improve" suggestions.
 */
export function evaluateDailySignals(entry: BodyLogEntry): DailySignalsState {
  const sleepOk =
    (entry.sleepHours != null && entry.sleepHours >= 6 && entry.sleepHours <= 9) ?? false;
  const sleepQualityOk = (entry.sleepQuality == null || entry.sleepQuality >= 3) ?? true;
  const energyOk = (entry.energy == null || entry.energy >= 3) ?? true;
  const moodOk = (entry.mood == null || entry.mood >= 3) ?? true;
  const hydrationOk = (entry.hydration == null || entry.hydration >= 3) ?? true;
  const stressOk = (entry.stress == null || entry.stress <= 3) ?? true;

  const frictionPoints: string[] = [];
  if (entry.sleepHours != null && (entry.sleepHours < 6 || entry.sleepHours > 9))
    frictionPoints.push('sleep');
  if (entry.sleepQuality != null && entry.sleepQuality < 3) frictionPoints.push('sleep');
  if (entry.energy != null && entry.energy <= 2) frictionPoints.push('energy');
  if (entry.mood != null && entry.mood <= 2) frictionPoints.push('mood');
  if (entry.hydration != null && entry.hydration <= 2) frictionPoints.push('hydration');
  if (entry.stress != null && entry.stress >= 4) frictionPoints.push('stress');

  return {
    sleepOk,
    sleepQualityOk,
    energyOk,
    moodOk,
    hydrationOk,
    stressOk,
    frictionPoints,
  };
}

/**
 * Calculate Pulse Score (0–100) from one day's entry.
 * Includes sleep duration, sleep quality, energy, mood, hydration, stress, weight trend.
 */
export function calculatePulseScore(
  entry: BodyLogEntry,
  recent: BodyLogEntry[]
): number {
  let score = 50;

  if (entry.sleepHours != null) {
    if (entry.sleepHours >= 7 && entry.sleepHours <= 9) score += 12;
    else if (entry.sleepHours >= 6 && entry.sleepHours < 10) score += 4;
    else score -= 8;
  }
  if (entry.sleepQuality != null) {
    score += (entry.sleepQuality - 3) * 4;
  }
  if (entry.energy != null) score += (entry.energy - 3) * 6;
  if (entry.mood != null) score += (entry.mood - 3) * 6;
  if (entry.hydration != null) score += (entry.hydration - 3) * 4;
  if (entry.stress != null) score -= (entry.stress - 3) * 5;
  if (entry.weight != null && recent.length >= 2) {
    const prev = recent.find((l) => l.date < entry.date);
    if (prev?.weight != null && Math.abs(prev.weight - entry.weight) < 0.5) score += 3;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * High-level themes from notes (context only). Never diagnose.
 * Used to nudge suggestions (rest, hydration, sleep, reduce load).
 */
function getNotesContext(notes: string | undefined): string[] {
  if (!notes || !notes.trim()) return [];
  const lower = notes.toLowerCase();
  const themes: string[] = [];
  if (/\b(tired|fatigue|exhausted|drained)\b/.test(lower)) themes.push('fatigue');
  if (/\b(stress|stressed|overwhelm|deadline)\b/.test(lower)) themes.push('stress');
  if (/\b(sick|unwell|headache|recovery)\b/.test(lower)) themes.push('recovery');
  if (/\b(sleep|insomnia|rest)\b/.test(lower)) themes.push('sleep');
  if (/\b(dry|thirst|water|hydrat)\b/.test(lower)) themes.push('hydration');
  return themes;
}

/**
 * Generate insight, explanation, and up to 3 improvement suggestions.
 * Non-medical language only: "may", "likely", "suggests".
 */
export function generateInsights(
  entry: BodyLogEntry,
  score: number,
  trend: 'up' | 'down' | 'stable',
  state: DailySignalsState,
  previousScore?: number
): { insight: string; explanation: string; improvements: string[] } {
  const noteThemes = getNotesContext(entry.notes);
  const improvements: string[] = [];

  // Build suggestions from friction points (max 3). Notes influence cautiously.
  if (state.frictionPoints.includes('sleep') || noteThemes.includes('sleep')) {
    improvements.push('Improve sleep consistency - aim for similar bed and wake times.');
  }
  if (state.frictionPoints.includes('hydration') || noteThemes.includes('hydration')) {
    improvements.push('Increase hydration - small sips throughout the day may help.');
  }
  if (state.frictionPoints.includes('stress') || noteThemes.includes('stress')) {
    improvements.push('Reduce load today - short breaks or lighter tasks may help.');
  }
  if (state.frictionPoints.includes('energy') || noteThemes.includes('fatigue')) {
    improvements.push('Prioritize rest or light movement instead of intense exercise.');
  }
  if (state.frictionPoints.includes('mood')) {
    improvements.push('A calm walk or a few minutes outdoors may support mood.');
  }
  if (noteThemes.includes('recovery') && !improvements.some((i) => i.includes('rest'))) {
    improvements.push('Your inputs suggest your body may need recovery. Prioritize rest and hydration.');
  }

  // When no friction-based suggestions, show gentle fallback tips so "What to improve" is never empty (once user has logged)
  if (improvements.length === 0) {
    improvements.push('Keep consistent sleep times when you can.');
    improvements.push('Stay hydrated with small sips throughout the day.');
    improvements.push('Short breaks may help keep energy steady.');
  }

  const capped = improvements.slice(0, MAX_IMPROVEMENTS);

  // One-line insight
  let insight: string;
  if (trend === 'up') {
    insight = 'Your Pulse Score is up today - small steps are adding up.';
  } else if (trend === 'down' && previousScore != null) {
    insight = 'Your Pulse Score is lower today; the suggestions below may help.';
  } else if (capped.length > 0) {
    insight = 'Focus on one or two of the suggestions below to improve your score.';
  } else {
    insight = 'Keep logging to get personalized insights.';
  }

  // Short explanation: "lower mainly due to X and Y" or "steady / up because..."
  let explanation: string;
  const reasons: string[] = [];
  if (state.frictionPoints.includes('sleep')) reasons.push('sleep');
  if (state.frictionPoints.includes('stress')) reasons.push('stress');
  if (state.frictionPoints.includes('energy')) reasons.push('low energy');
  if (state.frictionPoints.includes('hydration')) reasons.push('hydration');
  if (state.frictionPoints.includes('mood')) reasons.push('mood');

  if (trend === 'down' && reasons.length > 0) {
    explanation = `Your Pulse Score is lower today mainly due to ${reasons.slice(0, 2).join(' and ')}.`;
  } else if (trend === 'down') {
    explanation = 'Your Pulse Score is a bit lower today; small changes may help.';
  } else if (trend === 'up') {
    explanation = 'Your Pulse Score is up - your signals suggest a better baseline today.';
  } else {
    explanation = 'Your Pulse Score is steady. The suggestions below may help you nudge it up.';
  }

  return { insight, explanation, improvements: capped };
}

/**
 * Compute Body Pulse for today: score, trend, insight, explanation, improvements (max 3).
 * Public API used by Overview screen.
 */
export function computeBodyPulse(): BodyPulseSnapshot {
  const recent = logs.filter((l) => l.date <= getToday()).slice(0, 14);
  if (recent.length === 0) {
    return {
      score: 0,
      trend: 'stable',
      insight: 'Log your first entry to see your Body Pulse.',
      explanation: 'After you log sleep, energy, mood, and other signals, you’ll get a score and suggestions.',
      improvements: [],
      date: getToday(),
    };
  }

  const latest = recent[0];
  const state = evaluateDailySignals(latest);
  const score = calculatePulseScore(latest, recent);
  const prevScore =
    recent.length >= 2 ? calculatePulseScore(recent[1], recent) : score;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (score > prevScore + 3) trend = 'up';
  else if (score < prevScore - 3) trend = 'down';

  const { insight, explanation, improvements } = generateInsights(
    latest,
    score,
    trend,
    state,
    prevScore
  );

  return {
    score,
    trend,
    insight,
    explanation,
    improvements,
    date: getToday(),
  };
}

/**
 * Compute Body Pulse with AI insights when available (API or OpenAI).
 * Score and trend are always rule-based; insight, explanation, improvements come from AI or fallback.
 */
export async function computeBodyPulseAsync(): Promise<BodyPulseSnapshot> {
  const ruleBased = computeBodyPulse();
  const recent = logs.filter((l) => l.date <= getToday()).slice(0, 14);
  if (recent.length === 0) return ruleBased;

  const latest = recent[0];
  const state = evaluateDailySignals(latest);
  const prevScore =
    recent.length >= 2 ? calculatePulseScore(recent[1], recent) : undefined;
  const ai = await fetchAIInsights(
    latest,
    ruleBased.score,
    ruleBased.trend,
    state,
    prevScore
  );

  if (ai) {
    return {
      score: ruleBased.score,
      trend: ruleBased.trend,
      insight: ai.insight,
      explanation: ai.explanation,
      improvements: ai.improvements.slice(0, MAX_IMPROVEMENTS),
      date: ruleBased.date,
    };
  }
  return ruleBased;
}

export function getLogsForRange(days: number): BodyLogEntry[] {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return logs
    .filter((l) => l.date >= startStr && l.date <= endStr)
    .sort((a, b) => a.date.localeCompare(b.date));
}
