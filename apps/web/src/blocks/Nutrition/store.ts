/**
 * Nutrition block: fridge log entries (freezer, main, veggie).
 * Stored in localStorage; no API yet.
 */
import type { FridgeLogEntry, FridgePhoto } from './types';

const STORAGE_KEY = '@pulse/nutrition_fridge_logs';

function generateId(): string {
  return `fridge_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadEntries(): FridgeLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FridgeLogEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveEntries(entries: FridgeLogEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** All fridge logs, newest first. */
export function getFridgeLogs(): FridgeLogEntry[] {
  const entries = loadEntries();
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/** Latest fridge log (by timestamp). */
export function getLatestFridgeLog(): FridgeLogEntry | undefined {
  const logs = getFridgeLogs();
  return logs[0];
}

/** Fridge logs in the last N days, newest first. */
export function getFridgeLogsForRange(days: number): FridgeLogEntry[] {
  const entries = loadEntries();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return entries
    .filter((e) => new Date(e.timestamp) >= cutoff)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/** Whether the user has logged fridge photos today (any slot). */
export function hasFridgeLogToday(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const latest = getLatestFridgeLog();
  return !!latest && latest.timestamp.slice(0, 10) === today;
}

/**
 * Add a new fridge log. All three slots are optional; best result with freezer + main + veggie.
 */
export function addFridgeLog(entry: {
  freezer?: FridgePhoto;
  main?: FridgePhoto;
  veggie?: FridgePhoto;
  notes?: string;
}): FridgeLogEntry {
  const log: FridgeLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...(entry.freezer && { freezer: entry.freezer }),
    ...(entry.main && { main: entry.main }),
    ...(entry.veggie && { veggie: entry.veggie }),
    ...(entry.notes?.trim() && { notes: entry.notes.trim() }),
  };
  const entries = loadEntries();
  entries.push(log);
  saveEntries(entries);
  return log;
}

/** Get one log by id. */
export function getFridgeLogById(id: string): FridgeLogEntry | undefined {
  return loadEntries().find((e) => e.id === id);
}
