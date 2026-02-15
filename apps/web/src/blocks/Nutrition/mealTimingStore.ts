/**
 * Meal timing log (MVP Nutrition Block).
 * See docs/nutrition-block-design.md. Connects to Body Signals (sleep, appetite, energy).
 */
import type { MealTimingEntry } from './types';

const STORAGE_KEY = '@pulse/nutrition_meal_timing';

function generateId(): string {
  return `meal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadEntries(): MealTimingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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
