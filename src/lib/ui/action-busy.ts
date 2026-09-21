/** Tracks in-flight user mutations so the UI can show wait feedback. */

type Listener = () => void;

let pending = 0;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function getActionBusyCount() {
  return pending;
}

export function subscribeActionBusy(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function beginActionBusy() {
  pending += 1;
  emit();
}

export function endActionBusy() {
  pending = Math.max(0, pending - 1);
  emit();
}

export async function withActionBusy<T>(fn: () => Promise<T>): Promise<T> {
  beginActionBusy();
  try {
    return await fn();
  } finally {
    endActionBusy();
  }
}

const PASSIVE_METHODS = new Set([
  "refresh",
  "markNotificationRead",
  "markAllNotificationsRead",
  /** Optimistic chat — overlay on every send feels sticky. */
  "sendMessage",
  "sendSupportMessage",
]);

/** Wrap promise-returning AppData methods so every mutation bumps the busy counter. */
export function wrapAppDataWithActionBusy<T extends object>(data: T): T {
  const out = { ...data } as T;
  for (const key of Object.keys(data) as (keyof T)[]) {
    if (PASSIVE_METHODS.has(String(key))) continue;
    const value = data[key];
    if (typeof value !== "function") continue;
    const original = value as (...args: unknown[]) => unknown;
    (out as Record<string, unknown>)[key as string] = (
      ...args: unknown[]
    ) => {
      const result = original.apply(data, args);
      if (
        result != null &&
        typeof result === "object" &&
        "then" in result &&
        typeof (result as PromiseLike<unknown>).then === "function"
      ) {
        return withActionBusy(() => result as Promise<unknown>);
      }
      return result;
    };
  }
  return out;
}
