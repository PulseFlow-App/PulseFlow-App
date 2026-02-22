/**
 * Nutrition block AI result and aggregation handoff, persisted by date for Pulse aggregation.
 */
import { getStorageSuffix } from '../../stores/currentUser';

const STORAGE_KEY_PREFIX = '@pulse/nutrition_insights';

function getStorageKey(): string {
  return `${STORAGE_KEY_PREFIX}_${getStorageSuffix()}`;
}

export type NutritionInsightsEntry = {
  date: string;
  pattern: string;
  shaping: string;
  oneThing: string;
  aggregation_handoff?: Record<string, unknown> | null;
};

function loadMap(): Record<string, NutritionInsightsEntry> {
  try {
    const raw = localStorage.getItem(getStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, NutritionInsightsEntry>;
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveMap(map: Record<string, NutritionInsightsEntry>): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(map));
}

export function getNutritionInsightsForDate(date: string): NutritionInsightsEntry | undefined {
  return loadMap()[date];
}

export function setNutritionInsightsForDate(date: string, entry: NutritionInsightsEntry): void {
  const map = loadMap();
  map[date] = entry;
  saveMap(map);
}
