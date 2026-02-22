/**
 * Post-meal reflection ("Food → Signal" loop). Scoped by user.
 */
import { getStorageSuffix } from '../../stores/currentUser';
import type { PostMealReflectionEntry, PostMealFeeling } from './types';

const STORAGE_KEY_PREFIX = '@pulse/nutrition_post_meal_reflections';

function getStorageKey(): string {
  return `${STORAGE_KEY_PREFIX}_${getStorageSuffix()}`;
}

function generateId(): string {
  return `reflection_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadEntries(): PostMealReflectionEntry[] {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw) as PostMealReflectionEntry[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveEntries(entries: PostMealReflectionEntry[]): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(entries));
}

export function getPostMealReflections(): PostMealReflectionEntry[] {
  return loadEntries().sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function addPostMealReflection(entry: {
  date: string;
  feeling: PostMealFeeling;
  notes?: string;
}): PostMealReflectionEntry {
  const reflection: PostMealReflectionEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    date: entry.date,
    feeling: entry.feeling,
    ...(entry.notes?.trim() && { notes: entry.notes.trim() }),
  };
  const entries = loadEntries();
  entries.unshift(reflection);
  saveEntries(entries);
  return reflection;
}

export function getPostMealReflectionsForRange(days: number): PostMealReflectionEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return loadEntries().filter((e) => new Date(e.date) >= cutoff);
}

/** Whether the user has logged at least one post-meal reflection today. */
export function hasReflectionsToday(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return loadEntries().some((e) => e.date === today);
}
