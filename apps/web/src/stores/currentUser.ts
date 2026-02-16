/**
 * Current user id for scoping localStorage (streak, body logs, check-ins, nutrition).
 * Set by AuthContext on login/logout so each Google account has its own data.
 */
let currentUserId: string | null = null;

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function setCurrentUserId(userId: string | null): void {
  currentUserId = userId;
}

export function getStorageSuffix(): string {
  return currentUserId ?? 'anonymous';
}
