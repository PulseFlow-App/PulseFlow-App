/**
 * Rule-based nutrition pattern insights from Body Signals + meal timing + hydration.
 * See docs/nutrition-block-design.md. Feeds Nutrition overview and future AI.
 */
import { getBodyLogs } from '../BodySignals/store';
import { getMealTimingForRange } from './mealTimingStore';
import { getHydrationTimingForRange } from './hydrationTimingStore';

const LOOKBACK_DAYS = 14;

/** Return 0–3 short insight strings for the Nutrition block. */
export function getNutritionPatternInsights(): string[] {
  const insights: string[] = [];
  const bodyLogs = getBodyLogs().slice(0, 30);
  const mealTimings = getMealTimingForRange(LOOKBACK_DAYS);
  const hydrationTimings = getHydrationTimingForRange(LOOKBACK_DAYS);

  if (bodyLogs.length < 2) return insights;

  const lowSleepDays = bodyLogs.filter((e) => (e.sleepHours ?? 99) < 6);
  const highAppetiteDays = bodyLogs.filter((e) => (e.appetite ?? 0) >= 4);
  const lowEnergyDays = bodyLogs.filter((e) => (e.energy ?? 99) <= 2);
  const highStressDays = bodyLogs.filter((e) => (e.stress ?? 0) >= 4);
  const lowHydrationDays = bodyLogs.filter((e) => (e.hydration ?? 99) <= 2);

  const lateEaters = mealTimings.filter((e) => e.lateNightEating === true);
  const noFirstMeal = mealTimings.filter((e) => !e.firstMealTime || e.firstMealTime > '11:00');

  if (lowSleepDays.length >= 2 && highAppetiteDays.length >= 2) {
    insights.push('Hunger often rises after short-sleep days. Earlier or more consistent sleep may help appetite stay steady.');
  }
  if (highStressDays.length >= 2 && bodyLogs.some((e) => (e.appetite ?? 0) <= 2)) {
    insights.push('Appetite tends to drop on high-stress days. Light, easy meals and hydration can help.');
  }
  if (lateEaters.length >= 2 && lowSleepDays.length >= 1) {
    insights.push('Late-night eating often pairs with poorer sleep. Try an earlier last meal on busy nights.');
  }
  if (noFirstMeal.length >= 2 && lowEnergyDays.length >= 1) {
    insights.push('Skipping or delaying first meal can set up an afternoon crash. A small morning meal may steady energy.');
  }
  if (lowHydrationDays.length >= 2 && lowEnergyDays.length >= 1) {
    insights.push('Low hydration often clusters with low energy. Sipping through the day can help.');
  }
  if (hydrationTimings.length >= 3 && bodyLogs.length >= 5) {
    const busyDays = hydrationTimings.filter((e) => e.when.includes('during_work') && e.when.length <= 2);
    if (busyDays.length >= 2) {
      insights.push('On busy workdays hydration sometimes drops. Keep water visible during focus blocks.');
    }
  }

  return insights.slice(0, 3);
}
