/**
 * Notification preferences: 9am and 9pm local time reminders.
 * Permission is requested when user enables; actual firing uses local time check when app is open
 * (or Web Push from backend if implemented).
 */

const PREF_KEY = '@pulse/notifications_9_21';
const LAST_9AM_KEY = '@pulse/notifications_last_9am';
const LAST_9PM_KEY = '@pulse/notifications_last_9pm';

export function getNotificationsEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const perm = await Notification.requestPermission();
  return perm;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLastSent(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLastSent(key: string): void {
  try {
    localStorage.setItem(key, getToday());
  } catch {
    // ignore
  }
}

/** Show a one-time notification at 9am or 9pm local if not already sent today. */
function maybeShowScheduledNotification(hour: 9 | 21): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (!getNotificationsEnabled()) return;

  const now = new Date();
  if (now.getHours() !== hour || now.getMinutes() > 5) return;

  const key = hour === 9 ? LAST_9AM_KEY : LAST_9PM_KEY;
  if (getLastSent(key) === getToday()) return;

  const title = hour === 9 ? 'Good morning' : 'Evening check-in';
  const body = 'Time for a quick Pulse check-in.';
  try {
    new Notification(title, { body, tag: `pulse-${hour}` });
    setLastSent(key);
  } catch {
    // ignore
  }
}

let checkInterval: ReturnType<typeof setInterval> | null = null;

/** Start checking every minute for 9am and 9pm local; call when app is active and notifications enabled. */
export function startNotificationChecks(): void {
  if (checkInterval != null) return;
  if (!getNotificationsEnabled()) return;

  const check = () => {
    maybeShowScheduledNotification(9);
    maybeShowScheduledNotification(21);
  };
  check();
  checkInterval = setInterval(check, 60 * 1000);
}

/** Stop the 9am/9pm check interval (e.g. when user disables notifications). */
export function stopNotificationChecks(): void {
  if (checkInterval != null) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}
