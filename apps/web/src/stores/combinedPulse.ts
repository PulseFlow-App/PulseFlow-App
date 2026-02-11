/**
 * Combined Pulse: aggregates Body Signals and Work Routine for today.
 * Also provides aggregated pulse across all log-ins and check-ins.
 */
import { hasBodyToday, getTodayBodyScore, getBodyLogs, calculatePulseScore } from '../blocks/BodySignals/store';
import { hasRoutineToday, getTodayRoutineScore, getCheckIns, getScoreForCheckIn } from '../blocks/WorkRoutine/store';

export type CombinedPulseSource = 'body' | 'routine';

export type CombinedPulseResult = {
  body: number | null;
  routine: number | null;
  /** Combined score: average when both, else the single source. */
  combined: number | null;
  sources: CombinedPulseSource[];
};

export function getCombinedPulse(): CombinedPulseResult {
  const body = getTodayBodyScore();
  const routine = getTodayRoutineScore();
  const sources: CombinedPulseSource[] = [];
  if (body !== null) sources.push('body');
  if (routine !== null) sources.push('routine');

  let combined: number | null = null;
  if (body !== null && routine !== null) {
    combined = Math.round((body + routine) / 2);
  } else if (body !== null) {
    combined = body;
  } else if (routine !== null) {
    combined = routine;
  }

  return { body, routine, combined, sources };
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
