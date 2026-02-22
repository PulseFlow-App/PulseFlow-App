/**
 * Builds the payload for POST /report/daily from today's block data.
 * Pass bodySnapshot from Pulse (or compute before calling) when body is logged today.
 */
import { getBodyLogs } from '../blocks/BodySignals/store';
import type { BodyPulseSnapshot } from '../blocks/BodySignals/types';
import { getLatestCheckIn } from '../blocks/WorkRoutine/store';
import { getMealTimingForDate } from '../blocks/Nutrition/mealTimingStore';
import { getHydrationTimingForDate } from '../blocks/Nutrition/hydrationTimingStore';
import { getPostMealReflections } from '../blocks/Nutrition/postMealReflectionStore';
import { getLatestFridgeLog } from '../blocks/Nutrition/store';
import { getMealPhotoInsightsForDate } from '../blocks/Nutrition/mealPhotoStore';
import {
  hasBodyTodayCheck,
  hasRoutineTodayCheck,
  hasNutritionTodayCheck,
} from '../stores/combinedPulse';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export type DailyReportPayload = {
  report_date: string;
  body?: {
    log: Record<string, unknown>;
    snapshot: BodyPulseSnapshot;
  };
  work?: {
    checkIn: Record<string, unknown>;
  };
  nutrition?: {
    mealTiming: Record<string, unknown> | null;
    hydration: Record<string, unknown> | null;
    reflections: unknown[];
    fridge: Record<string, unknown> | null;
    meal_photo_insights: string[];
  };
};

export function buildDailyReportPayload(bodySnapshot: BodyPulseSnapshot | null): DailyReportPayload {
  const today = todayStr();
  const payload: DailyReportPayload = { report_date: today };

  if (hasBodyTodayCheck()) {
    const logs = getBodyLogs();
    const entry = logs.find((l) => l.date === today);
    if (entry && bodySnapshot) {
      payload.body = {
        log: {
          date: entry.date,
          sleepHours: entry.sleepHours,
          sleepQuality: entry.sleepQuality,
          energy: entry.energy,
          mood: entry.mood,
          hydration: entry.hydration,
          stress: entry.stress,
          appetite: entry.appetite,
          digestion: entry.digestion,
          notes: entry.notes,
        },
        snapshot: bodySnapshot,
      };
    }
  }

  if (hasRoutineTodayCheck()) {
    const latest = getLatestCheckIn();
    if (latest && latest.timestamp.slice(0, 10) === today) {
      payload.work = {
        checkIn: {
          timestamp: latest.timestamp,
          timeOfDay: latest.timeOfDay,
          metrics: latest.metrics,
          analysis: latest.analysis,
        },
      };
    }
  }

  if (hasNutritionTodayCheck()) {
    const meal = getMealTimingForDate(today);
    const hydration = getHydrationTimingForDate(today);
    const reflections = getPostMealReflections().filter((r) => r.date === today);
    const fridge = getLatestFridgeLog();
    const fridgeToday = fridge?.timestamp?.slice(0, 10) === today ? fridge : undefined;
    const meal_photo_insights = getMealPhotoInsightsForDate(today);
    payload.nutrition = {
      mealTiming: meal
        ? {
            firstMealTime: meal.firstMealTime,
            lastMealTime: meal.lastMealTime,
            biggestMeal: meal.biggestMeal,
            lateNightEating: meal.lateNightEating,
            proteinAtBreakfast: meal.proteinAtBreakfast,
            proteinAtLastMeal: meal.proteinAtLastMeal,
          }
        : null,
      hydration: hydration ? { when: hydration.when, notes: hydration.notes } : null,
      reflections: reflections.map((r) => ({ feeling: r.feeling, notes: r.notes })),
      fridge: fridgeToday
        ? { hasPhotos: !!(fridgeToday.freezer || fridgeToday.main || fridgeToday.veggie), notes: fridgeToday.notes }
        : null,
      meal_photo_insights,
    };
  }

  return payload;
}
