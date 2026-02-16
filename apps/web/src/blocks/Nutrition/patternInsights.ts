/**
 * Nutrition pattern insights: regulation support (timing, hydration, recovery).
 * Canonical: apps/ai-engine/prompts/nutrition-regulation-system-prompt.md
 * Returns structured block (pattern + influencing + one adjustment); no generic clichés.
 */
import { getBodyLogs } from '../BodySignals/store';
import { getLatestCheckIn } from '../WorkRoutine/store';
import { getMealTimingForRange, getMealTimingForDate } from './mealTimingStore';
import { getHydrationTimingForRange, getHydrationTimingForDate } from './hydrationTimingStore';
import { getRecoverySituation } from './recoverySituation';
import type { NutritionPatternBlock, NutritionStabilityLabel, NutritionSituationMode } from './types';

const LOOKBACK_DAYS = 14;
const WEEK_DAYS = 7;

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** True if time string (HH or HH:MM) is after 11:00 (late first meal). */
function isLateFirstMeal(time: string | undefined): boolean {
  if (!time) return true;
  const [h, m] = time.split(':').map((n) => parseInt(n, 10) || 0);
  return h > 11 || (h === 11 && m > 0);
}

/** Weekly nutrition stability: days with meal or hydration logged in last 7 days. */
export function getWeeklyNutritionStability(): { daysLogged: number; score: number; label: string } {
  const mealTimings = getMealTimingForRange(WEEK_DAYS);
  const hydrationTimings = getHydrationTimingForRange(WEEK_DAYS);
  const dates = new Set([
    ...mealTimings.map((e) => e.date),
    ...hydrationTimings.map((e) => e.date),
  ]);
  const daysLogged = dates.size;
  const score = Math.min(100, Math.round((daysLogged / 7) * 100));
  const label =
    daysLogged === 0
      ? 'No data yet'
      : score >= 70
        ? 'Good consistency'
        : score >= 40
          ? 'Building consistency'
          : 'A few days logged';
  return { daysLogged, score, label };
}

/**
 * Structured nutrition pattern block for the Overview.
 * CASE A: no logs this week → no_data, direct action.
 * CASE B: stable → maintain mode.
 * CASE C/D: friction → adjust or recovery with specific pattern and lever.
 */
export function getNutritionPatternBlock(): NutritionPatternBlock {
  const today = getToday();
  const bodyLogs = getBodyLogs().slice(0, 30);
  const todayBody = bodyLogs.find((e) => e.date === today);
  const mealTimings = getMealTimingForRange(LOOKBACK_DAYS);
  const hydrationTimings = getHydrationTimingForRange(LOOKBACK_DAYS);
  const todayMeal = getMealTimingForDate(today);
  const todayHydration = getHydrationTimingForDate(today);
  const recovery = getRecoverySituation();

  const weekMealDates = new Set(getMealTimingForRange(WEEK_DAYS).map((e) => e.date));
  const weekHydrationDates = new Set(getHydrationTimingForRange(WEEK_DAYS).map((e) => e.date));
  const weekLogCount = new Set([...weekMealDates, ...weekHydrationDates]).size;

  // ——— CASE A: No logs this week ———
  if (weekLogCount === 0) {
    return {
      pattern: 'You have no nutrition signals logged this week, so stability cannot be assessed yet.',
      influencing: [],
      oneAdjustment: 'Log just one meal time or hydration moment today. That\'s enough to start detecting patterns.',
      stabilityLabel: 'no_data',
      mode: 'no_data',
    };
  }

  const lowSleep = (todayBody?.sleepHours ?? 99) < 6 || (todayBody?.sleepQuality ?? 99) <= 2;
  const lowEnergy = (todayBody?.energy ?? 99) <= 2;
  const highStress = (todayBody?.stress ?? 0) >= 4;
  const lowAppetite = (todayBody?.appetite ?? 99) <= 2;
  const lowHydration = (todayBody?.hydration ?? 99) <= 2;
  const lateFirst = !todayMeal?.firstMealTime || isLateFirstMeal(todayMeal.firstMealTime);
  const reactiveHydration = todayHydration?.when?.length === 0 && lowEnergy; // no hydration timing logged and energy low
  const workNotes = getLatestCheckIn()?.metrics?.notes ?? '';
  const backToBackCalls = /\b(back to back|calls all day|meetings all day)\b/.test(
    [todayBody?.notes, workNotes].filter(Boolean).join(' ').toLowerCase()
  );

  const overload =
    (recovery !== 'normal' && lowEnergy) ||
    (lowSleep && highStress) ||
    (recovery === 'party_night' && lowSleep);

  // ——— Recovery mode ———
  if (overload || recovery === 'gym_day' || recovery === 'party_night') {
    const pattern =
      recovery === 'party_night'
        ? 'Late night planned with possible sleep squeeze. Recovery and light digestion matter more than volume.'
        : recovery === 'gym_day'
          ? 'Training adds recovery demand. Timing and hydration matter more than volume today.'
          : 'Sleep and stress are adding load. Meal timing and hydration can support recovery.';
    const influencing: string[] = [
      'Recovery demand is high; timing and hydration matter more than volume.',
    ];
    if (lowSleep) influencing.push('Poor sleep increases next-day sensitivity to late or heavy meals.');
    if (recovery === 'party_night') influencing.push('Lighter meal before and hydration during can ease tomorrow.');
    return {
      pattern,
      influencing,
      oneAdjustment:
        recovery === 'party_night'
          ? 'Prioritize one pre-event meal and hydration; keep tonight\'s meal lighter to support sleep and tomorrow\'s energy.'
          : recovery === 'gym_day'
            ? 'One recovery-oriented meal (protein + carbs) and hydrate earlier rather than catch-up later.'
            : 'Hydration earlier in the day and an earlier last meal may help more than changing what you eat.',
      stabilityLabel: 'recovery_needed',
      mode: 'recovery',
    };
  }

  // ——— Adjust mode: low energy + late first meal ———
  if (lowEnergy && lateFirst && todayMeal) {
    return {
      pattern: 'Energy is lower and first meal was delayed. Long morning gaps often flatten afternoon focus.',
      influencing: [
        'Long morning gap increases afternoon fatigue.',
        'Earlier fuel often stabilizes energy more than larger portions later.',
      ],
      oneAdjustment: 'Earlier fuel tomorrow may stabilize energy more than increasing portion size.',
      stabilityLabel: 'under_fueled',
      mode: 'adjust',
    };
  }

  // ——— Adjust mode: reactive hydration (no hydration logged, low energy) or back-to-back + no hydration ———
  if ((lowEnergy && lowHydration) || (backToBackCalls && !todayHydration?.when?.length)) {
    return {
      pattern: 'Hydration likely started after energy had already dropped. Proactive hydration often matters more than quantity.',
      influencing: [
        'Hydration started after energy had already dropped.',
        'On busy or call-heavy days, earlier sips reduce afternoon drag.',
      ],
      oneAdjustment: 'Move hydration earlier tomorrow. Timing may matter more than quantity.',
      stabilityLabel: 'compensating',
      mode: 'adjust',
    };
  }

  // ——— Adjust mode: late heavy meal + sleep ———
  const lateEaters = mealTimings.filter((e) => e.lateNightEating === true);
  if (lateEaters.length >= 2 && (lowSleep || todayBody?.sleepQuality != null)) {
    return {
      pattern: 'Late-night eating often pairs with poorer sleep. An earlier last meal can support sleep quality.',
      influencing: [
        'Late last meal can delay wind-down and lighten sleep.',
        'Shifting the last meal earlier on busy nights often helps more than changing food choice.',
      ],
      oneAdjustment: 'Try an earlier last meal on days when you want better sleep. Consistency matters more than perfection.',
      stabilityLabel: 'compensating',
      mode: 'adjust',
    };
  }

  // ——— Adjust mode: stress + low appetite ———
  if (highStress && lowAppetite) {
    return {
      pattern: 'Appetite tends to drop on high-stress days. Light, easy meals and hydration reduce extra load.',
      influencing: [
        'Stress amplifies appetite irregularity.',
        'Small, easy meals and steady sips often help more than forcing volume.',
      ],
      oneAdjustment: 'One small meal or snack and hydration earlier. No pressure on amount.',
      stabilityLabel: 'compensating',
      mode: 'adjust',
    };
  }

  // ——— CASE B: Maintain mode (stable) ———
  return {
    pattern: 'Energy and stress look stable. Timing will likely influence tomorrow more than today.',
    influencing: [
      'Consistency in first and last meal windows supports energy and sleep.',
      'On stable days, one small lever is enough.',
    ],
    oneAdjustment: 'Keep first and last meal within your usual window. Consistency matters more than perfection on stable days.',
    stabilityLabel: 'stable',
    mode: 'maintain',
  };
}

/** Legacy: return 0–3 short insight strings. Prefer getNutritionPatternBlock() for the Overview. */
export function getNutritionPatternInsights(): string[] {
  const block = getNutritionPatternBlock();
  if (block.mode === 'no_data') return [];
  const lines = [block.pattern, ...block.influencing, block.oneAdjustment];
  return lines.slice(0, 3);
}
