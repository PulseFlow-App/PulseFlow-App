/**
 * Meal photo entries: one photo per submission, with AI analysis or error.
 * Scoped by user. Used for daily list and aggregation_handoff.meal_photo_insights.
 */
import { getStorageSuffix } from '../../stores/currentUser';
import type { MealPhotoEntry, MealPhotoAnalysis } from './types';

const STORAGE_KEY_PREFIX = '@pulse/nutrition_meal_photos';

function getStorageKey(): string {
  return `${STORAGE_KEY_PREFIX}_${getStorageSuffix()}`;
}

function generateId(): string {
  return `meal_photo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadEntries(): MealPhotoEntry[] {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw) as MealPhotoEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveEntries(entries: MealPhotoEntry[]): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(entries));
}

export function getMealPhotoEntries(): MealPhotoEntry[] {
  return loadEntries().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getMealPhotosForDate(date: string): MealPhotoEntry[] {
  return loadEntries()
    .filter((e) => e.date === date)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function addMealPhoto(entry: {
  date: string;
  dataUrl: string;
  analysis?: MealPhotoAnalysis;
  error?: boolean;
}): MealPhotoEntry {
  const newEntry: MealPhotoEntry = {
    id: generateId(),
    date: entry.date,
    timestamp: new Date().toISOString(),
    dataUrl: entry.dataUrl,
    ...(entry.analysis && { analysis: entry.analysis }),
    ...(entry.error && { error: true }),
  };
  const entries = loadEntries();
  entries.unshift(newEntry);
  saveEntries(entries);
  return newEntry;
}

export function updateMealPhotoAnalysis(
  id: string,
  analysis: MealPhotoAnalysis | null,
  error?: boolean
): void {
  const entries = loadEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return;
  entries[idx] = {
    ...entries[idx],
    analysis: analysis ?? undefined,
    error,
  };
  saveEntries(entries);
}

/** One-sentence summary per photo for aggregation_handoff.nutrition.meal_photo_insights. */
export function getMealPhotoInsightsForDate(date: string): string[] {
  return getMealPhotosForDate(date)
    .filter((e) => e.analysis?.whatsOnPlate)
    .map((e) => e.analysis!.whatsOnPlate);
}

export function hasMealPhotosToday(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return getMealPhotosForDate(today).length > 0;
}

export function getMealPhotoById(id: string): MealPhotoEntry | undefined {
  return loadEntries().find((e) => e.id === id);
}
