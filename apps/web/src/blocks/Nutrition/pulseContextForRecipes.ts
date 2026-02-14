/**
 * Derives Pulse-based context for recipe suggestions.
 * AI recipe-from-fridge can use this so suggestions match the user's body signals and work routine.
 */
import type { RecipePersonalization } from './types';
import { getBodyLogs } from '../BodySignals/store';
import { getLatestCheckIn } from '../WorkRoutine/store';

function isToday(isoDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return isoDate.slice(0, 10) === today;
}

/**
 * Build personalization flags from today's body log and latest work check-in.
 * Used when calling recipe-from-fridge so the model can suggest e.g. energy-supporting or
 * recovery-oriented meals based on Pulse factors.
 */
export function getPulseContextForRecipes(): RecipePersonalization {
  const bodyLogs = getBodyLogs();
  const todayBody = bodyLogs.find((e) => isToday(e.date));
  const latestCheckIn = getLatestCheckIn();
  const notes = [todayBody?.notes, latestCheckIn?.metrics?.notes].filter(Boolean).join(' ').toLowerCase();

  const lowEnergy =
    (todayBody?.energy != null && todayBody.energy <= 2) ||
    /\b(tired|exhausted|low energy|drained|fatigue|no energy)\b/.test(notes);

  const heavyWorkout =
    /\b(gym|workout|training|exercise|ran|long run|heavy lift|recovery)\b/.test(notes);

  const lateNightPlanned =
    /\b(late night|party|going out|evening event|dinner out)\b/.test(notes);

  return {
    ...(lowEnergy && { lowEnergy: true }),
    ...(heavyWorkout && { heavyWorkout: true }),
    ...(lateNightPlanned && { lateNightPlanned: true }),
  };
}
