/**
 * App-wide usage streak: every day the user opens the app (e.g. visits dashboard) counts.
 * Streak = consecutive calendar days with at least one "app use" record, including today.
 */

const STORAGE_KEY = '@pulse/app_usage_dates';

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadDateStrings(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveDateStrings(dates: string[]): void {
  const unique = [...new Set(dates)].sort();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
}

/** Call when the user has "used" the app (e.g. landed on dashboard). Idempotent per day. */
export function recordAppUsage(): void {
  const today = getTodayDateString();
  const dates = loadDateStrings();
  if (dates.includes(today)) return;
  dates.push(today);
  saveDateStrings(dates);
}

/** Consecutive days with app usage including today. */
export function getAppStreak(): number {
  const dates = loadDateStrings();
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
  const today = getTodayDateString();
  if (sorted[0] !== today) return 0;
  let streak = 0;
  let cursor = today;
  for (const d of sorted) {
    if (d === cursor) {
      streak++;
      const next = new Date(cursor);
      next.setDate(next.getDate() - 1);
      cursor = next.toISOString().slice(0, 10);
    } else if (d < cursor) break;
  }
  return streak;
}
