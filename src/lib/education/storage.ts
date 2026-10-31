const STORAGE_KEY = "pulseflow_education_done_v1";

type DoneMap = Record<string, boolean>;

function readMap(): DoneMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as DoneMap;
  } catch {
    return {};
  }
}

function writeMap(map: DoneMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function hasCompletedEducation(profileId: string): boolean {
  if (!profileId) return true;
  return Boolean(readMap()[profileId]);
}

export function markEducationCompleted(profileId: string): void {
  if (!profileId) return;
  const map = readMap();
  map[profileId] = true;
  writeMap(map);
}
