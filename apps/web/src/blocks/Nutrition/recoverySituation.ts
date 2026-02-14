/**
 * Derives today's recovery situation from Body Signals + Work Routine.
 * Feeds situational nutrition (recovery support, light digestion, energy stabilization).
 * See docs/nutrition-block-design.md.
 */
import type { RecoverySituation } from './types';
import { getBodyLogs } from '../BodySignals/store';
import { getLatestCheckIn } from '../WorkRoutine/store';

function isToday(isoDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return isoDate.slice(0, 10) === today;
}

/**
 * Infer recovery situation for today from body log and work check-in notes/metrics.
 * Used to tailor nutrition suggestions (recovery meals, light digestion, etc.).
 */
export function getRecoverySituation(): RecoverySituation {
  const bodyLogs = getBodyLogs();
  const todayBody = bodyLogs.find((e) => isToday(e.date));
  const latestCheckIn = getLatestCheckIn();
  const notes = [todayBody?.notes, latestCheckIn?.metrics?.notes].filter(Boolean).join(' ').toLowerCase();

  const poorSleep =
    (todayBody?.sleepHours != null && todayBody.sleepHours < 6) ||
    (todayBody?.sleepQuality != null && todayBody.sleepQuality <= 2) ||
    /\b(poor sleep|slept badly|insomnia|tossed)\b/.test(notes);

  const gymDay = /\b(gym|workout|training|exercise|ran|long run|heavy lift)\b/.test(notes);
  const partyNight = /\b(party|going out|drinks|alcohol|late night)\b/.test(notes);
  const travelDay = /\b(travel|flight|road trip|hotel)\b/.test(notes);
  const deadlineDay =
    /\b(deadline|ship date|crunch|big day|presentation|delivery)\b/.test(notes);

  if (gymDay) return 'gym_day';
  if (partyNight) return 'party_night';
  if (travelDay) return 'travel_day';
  if (deadlineDay) return 'deadline_day';
  if (poorSleep) return 'poor_sleep_night';
  return 'normal';
}
