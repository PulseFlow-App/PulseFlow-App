/** Client-side block list (demo + optimistic UI). Server source of truth: user_blocks. */

const STORAGE_KEY = "pulseflow_blocked_users_v1";

export type BlockRecord = {
  blockedId: string;
  blockedName?: string;
  at: string;
};

function readAll(): Record<string, BlockRecord[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, BlockRecord[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, BlockRecord[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* private mode */
  }
}

export function listBlockedUsers(blockerId: string): BlockRecord[] {
  return readAll()[blockerId] ?? [];
}

export function isBlocked(blockerId: string, otherId: string): boolean {
  return listBlockedUsers(blockerId).some((b) => b.blockedId === otherId);
}

export function blockUserLocally(
  blockerId: string,
  blockedId: string,
  blockedName?: string,
) {
  if (blockerId === blockedId) return;
  const map = readAll();
  const list = map[blockerId] ?? [];
  if (list.some((b) => b.blockedId === blockedId)) return;
  map[blockerId] = [
    ...list,
    { blockedId, blockedName, at: new Date().toISOString() },
  ];
  writeAll(map);
}

export function unblockUserLocally(blockerId: string, blockedId: string) {
  const map = readAll();
  map[blockerId] = (map[blockerId] ?? []).filter((b) => b.blockedId !== blockedId);
  writeAll(map);
}

export function filterBlockedSender<T extends { sender_id: string }>(
  items: T[],
  blockerId: string | null | undefined,
): T[] {
  if (!blockerId) return items;
  const blocked = new Set(listBlockedUsers(blockerId).map((b) => b.blockedId));
  if (blocked.size === 0) return items;
  return items.filter((m) => !blocked.has(m.sender_id));
}
