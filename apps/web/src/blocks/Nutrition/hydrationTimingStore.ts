/**
 * Hydration timing log (when user hydrates). MVP Nutrition Block.
 * See docs/nutrition-block-design.md. Connects to Body hydration 1-5 and energy.
 */
import type { HydrationTimingEntry, HydrationContext } from './types';

const STORAGE_KEY = '@pulse/nutrition_hydration_timing';

function generateId(): string {
  return `hydration_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadEntries(): HydrationTimingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HydrationTimingEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveEntries(entries: HydrationTimingEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getHydrationTimingEntries(): HydrationTimingEntry[] {
  return loadEntries().sort((a, b) => b.date.localeCompare(a.date));
}

export function getHydrationTimingForDate(date: string): HydrationTimingEntry | undefined {
  return loadEntries().find((e) => e.date === date);
}

export function setHydrationTimingForDate(
  date: string,
  entry: { when: HydrationContext[]; notes?: string }
): HydrationTimingEntry {
  const entries = loadEntries();
  const existing = entries.find((e) => e.date === date);
  const updated: HydrationTimingEntry = {
    id: existing?.id ?? generateId(),
    date,
    when: entry.when,
    ...(entry.notes?.trim() && { notes: entry.notes.trim() }),
  };
  const rest = entries.filter((e) => e.date !== date);
  saveEntries([updated, ...rest]);
  return updated;
}

export function getHydrationTimingForRange(days: number): HydrationTimingEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return loadEntries()
    .filter((e) => e.date >= cutoffStr)
    .sort((a, b) => b.date.localeCompare(a.date));
}
