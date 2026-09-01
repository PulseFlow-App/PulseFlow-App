import type { Locale } from "@/lib/i18n";

const memory = new Map<string, string>();
const STORAGE_PREFIX = "pf_tr_";
const MAX_STORAGE_ENTRIES = 200;

function cacheKey(locale: Locale, text: string): string {
  return `${locale}::${text}`;
}

function storageKey(locale: Locale, text: string): string {
  const hash = Array.from(text)
    .reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
    .toString(36);
  return `${STORAGE_PREFIX}${locale}_${hash}_${text.length}`;
}

export function readCachedTranslation(
  locale: Locale,
  text: string,
): string | null {
  const key = cacheKey(locale, text);
  const hit = memory.get(key);
  if (hit) return hit;

  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(storageKey(locale, text));
    if (stored) {
      memory.set(key, stored);
      return stored;
    }
  } catch {
    /* ignore quota */
  }
  return null;
}

export function writeCachedTranslation(
  locale: Locale,
  text: string,
  translated: string,
): void {
  const key = cacheKey(locale, text);
  memory.set(key, translated);

  if (typeof window === "undefined") return;
  try {
    const sk = storageKey(locale, text);
    localStorage.setItem(sk, translated);
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(STORAGE_PREFIX),
    );
    if (keys.length > MAX_STORAGE_ENTRIES) {
      for (const old of keys.slice(0, keys.length - MAX_STORAGE_ENTRIES)) {
        localStorage.removeItem(old);
      }
    }
  } catch {
    /* ignore quota */
  }
}
