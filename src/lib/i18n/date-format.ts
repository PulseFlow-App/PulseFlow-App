import { format, parseISO } from "date-fns";
import {
  de,
  enUS,
  es,
  fr,
  he,
  it,
  ru,
  th,
  arSA,
} from "date-fns/locale";
import type { Locale } from "./types";

const DATE_FNS_LOCALES: Partial<
  Record<Locale, typeof enUS>
> = {
  en: enUS,
  de,
  th,
  fr,
  es,
  it,
  he,
  ru,
  ar: arSA,
  my: enUS,
};

export function getDateFnsLocale(locale: Locale) {
  return DATE_FNS_LOCALES[locale] ?? enUS;
}

export function formatShortDateLocalized(
  date: string | null | undefined,
  locale: Locale,
) {
  if (!date) return "-";
  const pattern = locale === "de" ? "d. MMM" : "d MMM";
  return format(parseISO(date), pattern, {
    locale: getDateFnsLocale(locale),
  });
}

export function formatWeekdayShort(date: Date, locale: Locale) {
  return format(date, "EEE", { locale: getDateFnsLocale(locale) });
}

export function formatMonthYear(date: Date, locale: Locale) {
  return format(date, "MMM yyyy", { locale: getDateFnsLocale(locale) });
}
