import en, { type Dictionary, type MessageKey } from "./dictionaries/en";
import th from "./dictionaries/th";
import my from "./dictionaries/my";
import fr from "./dictionaries/fr";
import de from "./dictionaries/de";
import es from "./dictionaries/es";
import it from "./dictionaries/it";
import he from "./dictionaries/he";
import ar from "./dictionaries/ar";
import ru from "./dictionaries/ru";
import {
  LOCALES,
  LOCALE_META,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "./types";
import { localePatches } from "./locale-patches";

export type { Locale, MessageKey, Dictionary };
export { LOCALES, LOCALE_META, LOCALE_STORAGE_KEY };

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  th,
  my,
  fr,
  de,
  es,
  it,
  he,
  ar,
  ru,
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const dict = dictionaries[locale] ?? en;
  let text = localePatches[locale]?.[key] ?? dict[key] ?? en[key] ?? key;

  // Plural forms: "one|other" or "one|few|many" - pick by count when present
  if (params && "count" in params && text.includes("|")) {
    const count = Number(params.count);
    const parts = text.split("|");
    if (parts.length === 2) {
      text = count === 1 ? parts[0]! : parts[1]!;
    } else if (parts.length >= 3) {
      text =
        count === 1 ? parts[0]! : count < 5 ? parts[1]! : parts[2]!;
    }
  }

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}
