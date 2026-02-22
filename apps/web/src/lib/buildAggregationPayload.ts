/**
 * Builds payload for POST /insights/pulse-aggregation when 2+ blocks are logged.
 * Collects handoffs from body snapshot, work analysis, nutrition insights store, and raw block data.
 */
import { getBodyLogs } from '../blocks/BodySignals/store';
import type { BodyPulseSnapshot } from '../blocks/BodySignals/types';
import { getLatestCheckIn } from '../blocks/WorkRoutine/store';
import { getMealTimingForDate } from '../blocks/Nutrition/mealTimingStore';
import { getHydrationTimingForDate } from '../blocks/Nutrition/hydrationTimingStore';
import { getPostMealReflections } from '../blocks/Nutrition/postMealReflectionStore';
import { getLatestFridgeLog } from '../blocks/Nutrition/store';
import { getMealPhotoInsightsForDate } from '../blocks/Nutrition/mealPhotoStore';
import { getNutritionInsightsForDate } from '../blocks/Nutrition/nutritionInsightsStore';
import { hasBodyTodayCheck, hasRoutineTodayCheck, hasNutritionTodayCheck } from '../stores/combinedPulse';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export type AggregationPayload = {
  mode: 'two_block' | 'three_block';
  date: string;
  blocks_logged: ('body' | 'work' | 'nutrition')[];
  handoffs: {
    body: Record<string, unknown> | null;
    work: Record<string, unknown> | null;
    nutrition: Record<string, unknown> | null;
  };
  raw: {
    body: Record<string, unknown> | null;
    work: Record<string, unknown> | null;
    nutrition: Record<string, unknown> | null;
  };
};

/**
 * Build aggregation request payload from current stores. Pass bodySnapshot when body is logged (so we have body handoff).
 */
export function buildAggregationPayload(bodySnapshot: BodyPulseSnapshot | null): AggregationPayload | null {
  const today = todayStr();
  const hasBody = hasBodyTodayCheck();
  const hasRoutine = hasRoutineTodayCheck();
  const hasNutrition = hasNutritionTodayCheck();
  const blocks: ('body' | 'work' | 'nutrition')[] = [];
  if (hasBody) blocks.push('body');
  if (hasRoutine) blocks.push('work');
  if (hasNutrition) blocks.push('nutrition');
  if (blocks.length < 2) return null;

  const mode: 'two_block' | 'three_block' = blocks.length === 3 ? 'three_block' : 'two_block';

  const handoffs = {
    body: (hasBody && bodySnapshot?.aggregation_handoff ? bodySnapshot.aggregation_handoff : null) as Record<string, unknown> | null,
    work: null as Record<string, unknown> | null,
    nutrition: null as Record<string, unknown> | null,
  };
  if (hasRoutine) {
    const latest = getLatestCheckIn();
    if (latest?.timestamp.slice(0, 10) === today && (latest.analysis as { aggregation_handoff?: unknown })?.aggregation_handoff) {
      handoffs.work = (latest.analysis as { aggregation_handoff: Record<string, unknown> }).aggregation_handoff;
    }
  }
  if (hasNutrition) {
    const ni = getNutritionInsightsForDate(today);
    if (ni?.aggregation_handoff) handoffs.nutrition = ni.aggregation_handoff as Record<string, unknown>;
  }

  const raw: AggregationPayload['raw'] = { body: null, work: null, nutrition: null };
  if (hasBody) {
    const logs = getBodyLogs();
    const entry = logs.find((l) => l.date === today);
    if (entry) {
      raw.body = {
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
      };
    }
  }
  if (hasRoutine) {
    const latest = getLatestCheckIn();
    if (latest && latest.timestamp.slice(0, 10) === today) {
      raw.work = {
        timestamp: latest.timestamp,
        timeOfDay: latest.timeOfDay,
        metrics: latest.metrics,
        analysis: latest.analysis,
      };
    }
  }
  if (hasNutrition) {
    const meal = getMealTimingForDate(today);
    const hydration = getHydrationTimingForDate(today);
    const reflections = getPostMealReflections().filter((r) => r.date === today);
    const fridge = getLatestFridgeLog();
    const fridgeToday = fridge?.timestamp?.slice(0, 10) === today ? fridge : undefined;
    const meal_photo_insights = getMealPhotoInsightsForDate(today);
    raw.nutrition = {
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

  return { mode, date: today, blocks_logged: blocks, handoffs, raw };
}

export type AggregationResult = {
  mode: 'two_block' | 'three_block';
  pulse_score_framing: string;
  what_connects: string;
  pulse_drivers: string[];
  recommendations: { action: string; observe: string; why: string }[];
  tomorrow_signal: string;
  cta: string | null;
};

export async function fetchPulseAggregation(
  apiBase: string,
  bodySnapshot: BodyPulseSnapshot | null
): Promise<AggregationResult | null> {
  const payload = buildAggregationPayload(bodySnapshot);
  if (!payload) return null;
  const res = await fetch(`${apiBase}/insights/pulse-aggregation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = new Error('Pulse aggregation failed') as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const data = await res.json().catch(() => null);
  if (!data || typeof data.what_connects !== 'string') return null;
  return {
    mode: data.mode === 'three_block' ? 'three_block' : 'two_block',
    pulse_score_framing: typeof data.pulse_score_framing === 'string' ? data.pulse_score_framing : '',
    what_connects: data.what_connects,
    pulse_drivers: Array.isArray(data.pulse_drivers) ? data.pulse_drivers : [],
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    tomorrow_signal: typeof data.tomorrow_signal === 'string' ? data.tomorrow_signal : '',
    cta: data.cta != null && typeof data.cta === 'string' ? data.cta : null,
  };
}
