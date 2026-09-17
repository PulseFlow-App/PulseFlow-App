import type { Locale } from "@/lib/i18n";

const SCRIPT_CHECKS: Partial<Record<Locale, RegExp>> = {
  he: /[\u0590-\u05FF]/,
  ar: /[\u0600-\u06FF]/,
  th: /[\u0E00-\u0E7F]/,
  my: /[\u1000-\u109F]/,
  ru: /[\u0400-\u04FF]/,
};

function scriptRatio(text: string, re: RegExp): number {
  const matches = text.match(new RegExp(re.source, "g"));
  if (!matches) return 0;
  const letters = text.replace(/\s+/g, "").length;
  if (letters < 4) return 0;
  return matches.length / letters;
}

/**
 * Best-effort source locale from distinctive scripts (Burmese, Thai, etc.).
 * Returns undefined for Latin / mixed / unknown — providers should auto-detect.
 */
export function detectLikelySourceLocale(text: string): Locale | undefined {
  let best: { locale: Locale; ratio: number } | undefined;
  for (const [locale, re] of Object.entries(SCRIPT_CHECKS) as [
    Locale,
    RegExp,
  ][]) {
    const ratio = scriptRatio(text, re);
    if (ratio > 0.25 && (!best || ratio > best.ratio)) {
      best = { locale, ratio };
    }
  }
  return best?.locale;
}

/** Skip API translation when text already looks like the target language. */
export function likelySameLanguage(text: string, locale: Locale): boolean {
  const detected = detectLikelySourceLocale(text);
  if (detected) return detected === locale;
  // Latin / unknown: treat as already matching English. Other Latin locales
  // (fr/de/es/it) still need the API for en→fr style conversions.
  return locale === "en";
}
