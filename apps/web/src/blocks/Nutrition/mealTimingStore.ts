/**
 * Meal timing log (MVP Nutrition Block). Scoped by user.
 */
import { getStorageSuffix } from '../../stores/currentUser';
import type { MealTimingEntry } from './types';

const STORAGE_KEY_PREFIX = '@pulse/nutrition_meal_timing';

function getStorageKey(): string {
  return `${STORAGE_KEY_PREFIX}_${getStorageSuffix()}`;
}

function generateId(): string {
  return `meal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadEntries(): MealTimingEntry[] {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw) as MealTimingEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveEntries(entries: MealTimingEntry[]): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(entries));
}

export function getMealTimingEntries(): MealTimingEntry[] {
  return loadEntries().sort((a, b) => b.date.localeCompare(a.date));
}

export function getMealTimingForDate(date: string): MealTimingEntry | undefined {
  return loadEntries().find((e) => e.date === date);
}

export function setMealTimingForDate(
  date: string,
  entry: Partial<Omit<MealTimingEntry, 'id' | 'date'>>
): MealTimingEntry {
  const entries = loadEntries();
  const existing = entries.find((e) => e.date === date);
  const updated: MealTimingEntry = {
    id: existing?.id ?? generateId(),
    date,
    ...existing,
    ...entry,
  };
  const rest = entries.filter((e) => e.date !== date);
  saveEntries([updated, ...rest]);
  return updated;
}

export function getMealTimingForRange(days: number): MealTimingEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return loadEntries()
    .filter((e) => e.date >= cutoffStr)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Whether the user has logged meal timing today. */
export function hasMealTimingToday(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return getMealTimingForDate(today) !== undefined;
}
