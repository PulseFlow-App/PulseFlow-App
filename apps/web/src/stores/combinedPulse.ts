/**
 * Combined Pulse: aggregates Body Signals, Work Routine, and Nutrition for today.
 * Used for 1/2/3-block progressive recommendations on the Pulse page.
 */
import { hasBodyToday, getTodayBodyScore, getBodyLogs, calculatePulseScore } from '../blocks/BodySignals/store';
import { hasRoutineToday, getTodayRoutineScore, getCheckIns, getScoreForCheckIn } from '../blocks/WorkRoutine/store';
import { hasFridgeLogToday } from '../blocks/Nutrition/store';
import { hasMealTimingToday } from '../blocks/Nutrition/mealTimingStore';
import { hasHydrationTimingToday } from '../blocks/Nutrition/hydrationTimingStore';

export type CombinedPulseSource = 'body' | 'routine' | 'nutrition';

export type CombinedPulseResult = {
  body: number | null;
  routine: number | null;
  /** Combined score: average of body + routine when both; nutrition does not contribute a number. */
  combined: number | null;
  sources: CombinedPulseSource[];
  /** 1, 2, or 3 — how many blocks have data today. */
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

/** Aggregated pulse from all body log-ins and all work routine check-ins. */
export function getAggregatedPulse(): {
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

export function hasBodyTodayCheck(): boolean {
  return hasBodyToday();
}

export function hasRoutineTodayCheck(): boolean {
  return hasRoutineToday();
}

export function hasNutritionTodayCheck(): boolean {
  return hasFridgeLogToday() || hasMealTimingToday() || hasHydrationTimingToday();
}
