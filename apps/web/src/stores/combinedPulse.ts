/**
 * Combined Pulse: aggregates Body Signals and Work Routine for today.
 * Used by the Pulse page to show one score and offer cross-block check-in.
 */
import { hasBodyToday, getTodayBodyScore } from '../blocks/BodySignals/store';
import { hasRoutineToday, getTodayRoutineScore } from '../blocks/WorkRoutine/store';

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

export function hasBodyTodayCheck(): boolean {
  return hasBodyToday();
}

export function hasRoutineTodayCheck(): boolean {
  return hasRoutineToday();
}
