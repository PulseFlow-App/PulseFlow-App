/**
 * Single fridge photo per day: one photo, AI analysis (what I can see + meal cards).
 * Submitting again for the same day replaces the previous entry and re-runs AI.
 */
import { getStorageSuffix } from '../../stores/currentUser';
import type { FridgePhotoEntry, FridgePhotoAnalysis } from './types';

const STORAGE_KEY_PREFIX = '@pulse/nutrition_fridge_photo';

function getStorageKey(): string {
  return `${STORAGE_KEY_PREFIX}_${getStorageSuffix()}`;
}

function loadEntries(): FridgePhotoEntry[] {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw) as FridgePhotoEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveEntries(entries: FridgePhotoEntry[]): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(entries));
}

export function getFridgePhotoForDate(date: string): FridgePhotoEntry | undefined {
  return loadEntries().find((e) => e.date === date);
}

/** Set or replace fridge photo for the day. Only one entry per date. */
export function setFridgePhotoForDate(
  date: string,
  entry: {
    dataUrl: string;
    analysis?: FridgePhotoAnalysis;
    error?: boolean;
  }
): FridgePhotoEntry {
  const entries = loadEntries().filter((e) => e.date !== date);
  const newEntry: FridgePhotoEntry = {
    date,
    dataUrl: entry.dataUrl,
    timestamp: new Date().toISOString(),
    ...(entry.analysis && { analysis: entry.analysis }),
    ...(entry.error && { error: true }),
  };
  entries.unshift(newEntry);
  saveEntries(entries);
  return newEntry;
}

export function hasFridgePhotoToday(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return getFridgePhotoForDate(today) !== undefined;
}
