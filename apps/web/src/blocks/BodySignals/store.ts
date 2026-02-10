/**
 * Body Signals - web store (localStorage). Same logic as mobile.
 * Optional AI via fetchAIInsights (backend at VITE_API_URL).
 */
import { fetchAIInsights } from './aiInsights';
import type { BodyLogEntry, BodyPulseSnapshot, DailySignalsState, FactorImpact } from './types';

const STORAGE_KEY = '@pulse/body_logs';
const MAX_IMPROVEMENTS = 3;

/** Remove em dashes from app/AI text so recommendations stay consistent. */
function noEmDash(s: string): string {
  return s.replace(/\u2014/g, '. ').replace(/\s+\.\s+/g, '. ').trim();
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadLogs(): BodyLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BodyLogEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveLogs(logs: BodyLogEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

let cache: BodyLogEntry[] | null = null;

function getLogs(): BodyLogEntry[] {
  if (cache === null) cache = loadLogs();
  return cache;
}

export function getBodyLogs(): BodyLogEntry[] {
  return [...getLogs()].sort((a, b) => b.date.localeCompare(a.date));
}

export function addBodyLog(entry: Omit<BodyLogEntry, 'id' | 'date'>): BodyLogEntry {
  const newEntry: BodyLogEntry = {
    ...entry,
    id: generateId(),
    date: getToday(),
  };
  const logs = getLogs();
  logs.unshift(newEntry);
  cache = logs;
  saveLogs(logs);
  return newEntry;
}

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

export function calculatePulseScore(entry: BodyLogEntry, recent: BodyLogEntry[]): number {
  let score = 50;
  if (entry.sleepHours != null) {
    if (entry.sleepHours >= 7 && entry.sleepHours <= 9) score += 12;
    else if (entry.sleepHours >= 6 && entry.sleepHours < 10) score += 4;
    else score -= 8;
  }
  if (entry.sleepQuality != null) score += (entry.sleepQuality - 3) * 4;
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

function getNotesContext(notes: string | undefined): string[] {
  if (!notes || !notes.trim()) return [];
  const lower = notes.toLowerCase();
  const themes: string[] = [];
  if (/\b(hungry|hunger|ravenous|starving|appetite|ready to eat)\b/.test(lower)) themes.push('hunger');
  if (/\b(bloat|digestion|stomach|gut|full)\b/.test(lower)) themes.push('digestion');
  if (/\b(tired|fatigue|exhausted|drained)\b/.test(lower)) themes.push('fatigue');
  if (/\b(stress|stressed|overwhelm|deadline)\b/.test(lower)) themes.push('stress');
  if (/\b(sick|unwell|headache|recovery)\b/.test(lower)) themes.push('recovery');
  if (/\b(sleep|insomnia|rest|waking|wake)\b/.test(lower)) themes.push('sleep');
  if (/\b(dry|thirst|water|hydrat)\b/.test(lower)) themes.push('hydration');
  if (/\b(dizzy|dizziness|lightheaded|light-headed|vertigo|woozy)\b/.test(lower)) themes.push('dizzy');
  return themes;
}

function getDefaultFactors(state: DailySignalsState): FactorImpact[] {
  const f: FactorImpact[] = [];
  if (state.frictionPoints.includes('sleep')) f.push({ factor: 'Sleep', impact: 'medium', affects: ['Energy', 'Mood'] });
  if (state.frictionPoints.includes('stress')) f.push({ factor: 'Stress', impact: 'medium', affects: ['Sleep', 'Mood'] });
  if (state.frictionPoints.includes('energy')) f.push({ factor: 'Energy', impact: 'medium', affects: ['Mood'] });
  if (state.frictionPoints.includes('hydration')) f.push({ factor: 'Hydration', impact: 'medium', affects: ['Energy'] });
  if (state.frictionPoints.includes('mood')) f.push({ factor: 'Mood', impact: 'medium', affects: ['Energy'] });
  return f;
}

export function generateInsights(
  entry: BodyLogEntry,
  _score: number,
  trend: 'up' | 'down' | 'stable',
  state: DailySignalsState,
  _previousScore?: number
): { insight: string; explanation: string; improvements: string[]; factors: FactorImpact[] } {
  const noteThemes = getNotesContext(entry.notes);
  const improvements: string[] = [];
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
  const hungerRelated = /hunger|appetite|eat|breakfast/i;
  if (noteThemes.includes('hunger') && !improvements.some((item) => hungerRelated.test(item))) {
    improvements.push('You mentioned hunger or appetite. Sleep and meal timing often affect this. Try a balanced breakfast and notice how the next days feel.');
  }
  const digestionRelated = /digestion|stomach|bloat/i;
  if (noteThemes.includes('digestion') && !improvements.some((item) => digestionRelated.test(item))) {
    improvements.push('You mentioned digestion. Smaller meals, hydration, and less stress may help.');
  }
  if (noteThemes.includes('dizzy') && !improvements.some((item) => /dizzy|lighthead|hydrat|sip|rest/i.test(item))) {
    improvements.push('You mentioned feeling dizzy or lightheaded. Common non-medical causes include dehydration, low blood sugar, or standing up too fast. Try sipping water, a small snack if you haven’t eaten, and moving slowly when you stand. If it persists, consider checking in with a healthcare provider.');
  }
  if (noteThemes.includes('recovery') && !improvements.some((i) => i.includes('rest'))) {
    improvements.push('Your inputs suggest your body may need recovery. Prioritize rest and hydration.');
  }
  if (improvements.length === 0) {
    improvements.push('Keep consistent sleep times when you can.');
    improvements.push('Stay hydrated with small sips throughout the day.');
    improvements.push('Short breaks may help keep energy steady.');
  }
  const capped = improvements.slice(0, MAX_IMPROVEMENTS);

  const reasons: string[] = [];
  if (state.frictionPoints.includes('sleep')) reasons.push('sleep');
  if (state.frictionPoints.includes('stress')) reasons.push('stress');
  if (state.frictionPoints.includes('energy')) reasons.push('low energy');
  if (state.frictionPoints.includes('hydration')) reasons.push('hydration');
  if (state.frictionPoints.includes('mood')) reasons.push('mood');
  const reasonText = reasons.slice(0, 2).join(' and ');

  let insight: string;
  let explanation: string;
  if (noteThemes.length > 0 && entry.notes?.trim()) {
    insight = "Your note and today's signals are reflected in the suggestions below.";
    explanation = reasonText ? `What's driving things: ${reasonText}.` : 'The table below shows what affects what.';
  } else if (trend === 'up') {
    insight = 'Your Pulse Score is up today. Small steps are adding up.';
    explanation = 'The table below shows what is helping.';
  } else if (trend === 'down' && reasonText) {
    insight = `Your Pulse Score is lower today mainly due to ${reasonText}. The suggestions below may help.`;
    explanation = 'The table below shows how these factors affect each other.';
  } else if (trend === 'down') {
    insight = 'Your Pulse Score is a bit lower today. The suggestions below may help.';
    explanation = 'The table below shows what influences your score.';
  } else if (capped.length > 0) {
    insight = reasonText ? `Focus on ${reasonText} to nudge your score up.` : 'Focus on one or two suggestions below.';
    explanation = 'The table below shows what affects what.';
  } else {
    insight = 'Keep logging to get personalized insights.';
    explanation = 'The table below shows what influences your body pulse.';
  }
  return { insight, explanation, improvements: capped, factors: getDefaultFactors(state) };
}

export function computeBodyPulse(): BodyPulseSnapshot {
  const logs = getLogs();
  const recent = logs.filter((l) => l.date <= getToday()).slice(0, 14);
  if (recent.length === 0) {
    return {
      score: 0,
      trend: 'stable',
      insight: 'Log your first entry to see your Body Pulse.',
      explanation: "After you log sleep, energy, mood, and other signals, you'll get a score and suggestions.",
      improvements: [],
      insightsSource: 'rule-based',
      date: getToday(),
    };
  }
  const latest = recent[0]!;
  const state = evaluateDailySignals(latest);
  const score = calculatePulseScore(latest, recent);
  const prevEntry = recent.length >= 2 ? recent[1] : undefined;
  const prevScore = prevEntry ? calculatePulseScore(prevEntry, recent) : score;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (score > prevScore + 3) trend = 'up';
  else if (score < prevScore - 3) trend = 'down';
  const { insight, explanation, improvements, factors } = generateInsights(
    latest,
    score,
    trend,
    state,
    prevScore
  );
  return { score, trend, insight, explanation, improvements, factors, insightsSource: 'rule-based', date: getToday() };
}

/**
 * Compute Body Pulse with optional AI insights (when VITE_API_URL is set).
 * Score and trend are always rule-based; insight, explanation, improvements may come from API.
 */
export async function computeBodyPulseAsync(): Promise<BodyPulseSnapshot> {
  const ruleBased = computeBodyPulse();
  const logs = getLogs();
  const recent = logs.filter((l) => l.date <= getToday()).slice(0, 14);
  if (recent.length === 0) return ruleBased;

  const latest = recent[0]!;
  const state = evaluateDailySignals(latest);
  const score = ruleBased.score;
  const prevEntry = recent.length >= 2 ? recent[1] : undefined;
  const prevScore = prevEntry ? calculatePulseScore(prevEntry, recent) : score;

  const ai = await fetchAIInsights(latest, score, ruleBased.trend, state, prevScore, recent);
  if (ai.result) {
    const r = ai.result;
    return {
      score: ruleBased.score,
      trend: ruleBased.trend,
      insight: noEmDash(r.insight),
      explanation: noEmDash(r.explanation),
      improvements: r.improvements.slice(0, MAX_IMPROVEMENTS).map(noEmDash),
      factors: r.factors?.length ? r.factors : ruleBased.factors,
      insightsSource: 'api',
      date: ruleBased.date,
    };
  }
  return { ...ruleBased, insightsError: ai.error ?? undefined };
}

export function getLogsForRange(days: number): BodyLogEntry[] {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return getBodyLogs()
    .filter((l) => l.date >= startStr && l.date <= endStr)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** True if the most recent body log is from today. */
export function hasBodyToday(): boolean {
  const logs = getBodyLogs();
  const latest = logs[0];
  return Boolean(latest && latest.date === getToday());
}

/** 0–100 Body Pulse score for today; null if no log today. */
export function getTodayBodyScore(): number | null {
  if (!hasBodyToday()) return null;
  return computeBodyPulse().score;
}
