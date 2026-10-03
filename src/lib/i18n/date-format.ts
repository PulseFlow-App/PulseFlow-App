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
  tr,
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
  tr,
};

export function getDateFnsLocale(locale: Locale) {
  return DATE_FNS_LOCALES[locale] ?? enUS;
}

export function formatShortDateLocalized(
  date: string | null | undefined,
  locale: Locale,
) {
  if (!date) return "-";
  // RU/DE: day then month abbreviation in that language («31 авг.» / «31. Aug»).
  const pattern = locale === "de" ? "d. MMM" : "d MMM";
  return format(parseISO(date), pattern, {
    locale: getDateFnsLocale(locale),
  });
}

/** Calendar / form display — avoid US «MMM d, yyyy» in RU. */
export function formatLongDateLocalized(date: Date, locale: Locale) {
  const pattern =
    locale === "ru" || locale === "de" || locale === "th" || locale === "tr"
      ? "d MMMM yyyy"
      : "MMM d, yyyy";
  return format(date, pattern, { locale: getDateFnsLocale(locale) });
}

export function formatMonthYearLocalized(date: Date, locale: Locale) {
  return format(date, "LLLL yyyy", { locale: getDateFnsLocale(locale) });
}

export function formatWeekdayShort(date: Date, locale: Locale) {
  return format(date, "EEE", { locale: getDateFnsLocale(locale) });
}

export function formatMonthYear(date: Date, locale: Locale) {
  return format(date, "MMM yyyy", { locale: getDateFnsLocale(locale) });
}
