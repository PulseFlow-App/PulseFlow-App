/** Client-side read receipts so badges clear even if a DB update is slow/fails. */

function storageKey(profileId: string) {
  return `pulseflow_read_notifs_v1_${profileId}`;
}

export function loadLocallyReadIds(profileId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(profileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function rememberLocallyRead(profileId: string, ids: string[]) {
  if (typeof window === "undefined" || !ids.length) return;
  const next = new Set(loadLocallyReadIds(profileId));
  for (const id of ids) next.add(id);
  // Cap growth — keep the newest ~500 ids
  const list = [...next];
  const trimmed = list.length > 500 ? list.slice(list.length - 500) : list;
  window.localStorage.setItem(storageKey(profileId), JSON.stringify(trimmed));
}

export function mergeReadBy(
  readBy: string[] | null | undefined,
  profileId: string,
  localReadIds: Iterable<string>,
  notificationId: string,
): string[] {
  const base = Array.isArray(readBy) ? readBy : [];
  if (base.includes(profileId)) return base;
  for (const id of localReadIds) {
    if (id === notificationId) {
      return [...base, profileId];
    }
  }
  return base;
}
