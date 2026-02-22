/**
 * Combined Pulse: aggregates Body Signals, Work Routine, and Nutrition for today.
 * Used for 1/2/3-block progressive recommendations on the Pulse page.
 */
import { hasBodyToday, getTodayBodyScore, getBodyLogs, calculatePulseScore } from '../blocks/BodySignals/store';
import { hasRoutineToday, getTodayRoutineScore, getCheckIns, getScoreForCheckIn } from '../blocks/WorkRoutine/store';
import { hasFridgeLogToday, getFridgeLogs } from '../blocks/Nutrition/store';
import { hasMealTimingToday, getMealTimingEntries } from '../blocks/Nutrition/mealTimingStore';
import { hasHydrationTimingToday, getHydrationTimingEntries } from '../blocks/Nutrition/hydrationTimingStore';

export type CombinedPulseSource = 'body' | 'routine' | 'nutrition';

export type CombinedPulseResult = {
  body: number | null;
  routine: number | null;
  /** Combined score: average of body + routine when both; nutrition does not contribute a number. */
  combined: number | null;
  sources: CombinedPulseSource[];
  /** 1, 2, or 3: how many blocks have data today. */
  blockCount: number;
};

export function getCombinedPulse(): CombinedPulseResult {
  const body = getTodayBodyScore();
  const routine = getTodayRoutineScore();
  const hasNutrition =
    hasFridgeLogToday() || hasMealTimingToday() || hasHydrationTimingToday();
  const sources: CombinedPulseSource[] = [];
  if (body !== null) sources.push('body');
  if (routine !== null) sources.push('routine');
  if (hasNutrition) sources.push('nutrition');

  let combined: number | null = null;
  if (body !== null && routine !== null) {
    combined = Math.round((body + routine) / 2);
  } else if (body !== null) {
    combined = body;
  } else if (routine !== null) {
    combined = routine;
  }

  return {
    body,
    routine,
    combined,
    sources,
    blockCount: sources.length,
  };
}

/** All-time pulse from all body logs and all work check-ins (combined). */
export function getAllTimePulse(): {
  score: number;
  bodyLogCount: number;
  checkInCount: number;
  hasData: boolean;
} {
  const bodyLogs = getBodyLogs();
  const checkIns = getCheckIns();
  const bodyScores = bodyLogs.map((entry) => calculatePulseScore(entry, bodyLogs));
  const routineScores = checkIns
    .map((e) => getScoreForCheckIn(e))
    .filter((s): s is number => s !== null);
  const allScores = [...bodyScores, ...routineScores];
  const count = allScores.length;
  const score = count === 0 ? 0 : Math.round(allScores.reduce((a, b) => a + b, 0) / count);
  return {
    score: Math.max(0, Math.min(100, score)),
    bodyLogCount: bodyLogs.length,
    checkInCount: checkIns.length,
    hasData: count > 0,
  };
}

/** @deprecated Use getAllTimePulse. Kept for compatibility. */
export function getAggregatedPulse() {
  return getAllTimePulse();
}

/** All-time Body Signals pulse (body logs only). */
export function getAllTimeBodyPulse(): { score: number; hasData: boolean } {
  const bodyLogs = getBodyLogs();
  if (bodyLogs.length === 0) return { score: 0, hasData: false };
  const scores = bodyLogs.map((entry) => calculatePulseScore(entry, bodyLogs));
  const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return { score: Math.max(0, Math.min(100, score)), hasData: true };
}

/** All-time Work Routine pulse (check-ins only). */
export function getAllTimeRoutinePulse(): { score: number; hasData: boolean } {
  const checkIns = getCheckIns();
  const scores = checkIns
    .map((e) => getScoreForCheckIn(e))
    .filter((s): s is number => s !== null);
  if (scores.length === 0) return { score: 0, hasData: false };
  const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return { score: Math.max(0, Math.min(100, score)), hasData: true };
}

/** All-time Nutrition: we don't have per-entry scores yet; returns hasData from any nutrition entries. */
export function getAllTimeNutritionPulse(): { score: number; hasData: boolean } {
  const hasData =
    getFridgeLogs().length > 0 ||
    getMealTimingEntries().length > 0 ||
    getHydrationTimingEntries().length > 0;
  return { score: 0, hasData };
}

export function hasBodyTodayCheck(): boolean {
  return hasBodyToday();
}

export function hasRoutineTodayCheck(): boolean {
  return hasRoutineToday();
}

/** Nutrition "done today" = required sub-components only (meal timing + hydration). Optional (fridge, reflections) don't gate. */
export function hasNutritionTodayCheck(): boolean {
  return hasMealTimingToday() && hasHydrationTimingToday();
}
