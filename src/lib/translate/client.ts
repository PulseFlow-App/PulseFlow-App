import type { Locale } from "@/lib/i18n";
import {
  readCachedTranslation,
  writeCachedTranslation,
} from "@/lib/translate/cache";

const inflight = new Map<string, Promise<string>>();

export async function fetchTranslation(
  text: string,
  target: Locale,
): Promise<string> {
  const cached = readCachedTranslation(target, text);
  if (cached) return cached;

  const key = `${target}::${text}`;
  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target }),
    });
    if (!res.ok) return text;
    const json = (await res.json()) as { translated?: string };
    const translated = json.translated?.trim() || text;
    if (translated !== text) {
      writeCachedTranslation(target, text, translated);
    }
    return translated;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}
