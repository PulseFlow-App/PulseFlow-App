import type { Locale } from "@/lib/i18n";

const SCRIPT_CHECKS: Partial<Record<Locale, RegExp>> = {
  he: /[\u0590-\u05FF]/,
  ar: /[\u0600-\u06FF]/,
  th: /[\u0E00-\u0E7F]/,
  my: /[\u1000-\u109F]/,
  ru: /[\u0400-\u04FF]/,
};

/** Skip API translation when text already looks like the target script. */
export function likelySameLanguage(text: string, locale: Locale): boolean {
  const re = SCRIPT_CHECKS[locale];
  if (!re) return false;
  const matches = text.match(new RegExp(re.source, "g"));
  if (!matches) return false;
  const letters = text.replace(/\s+/g, "").length;
  if (letters < 4) return false;
  return matches.length / letters > 0.25;
}
