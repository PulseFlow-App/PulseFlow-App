import { format, parseISO, isToday, isSameDay, startOfDay, subDays } from "date-fns";
import type { Locale } from "./i18n/types";
import { isLocale } from "./i18n";
import {
  formatShortDateLocalized,
  formatWeekdayShort,
  getDateFnsLocale,
} from "./i18n/date-format";
import type { Task } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const MONEY_LOCALE = "en-US";

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "VND", "IDR"]);

function formatMoneyWithDisplay(
  amount: number,
  currency: string,
  currencyDisplay: "symbol" | "narrowSymbol",
) {
  const code = currency.toUpperCase();
  return new Intl.NumberFormat(MONEY_LOCALE, {
    style: "currency",
    currency: code,
    currencyDisplay,
    maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 0,
  }).format(amount);
}

export function formatMoney(amount: number, currency = "THB") {
  return formatMoneyWithDisplay(amount, currency, "symbol");
}

/** Tighter currency for stat tiles (narrow symbol, no extra space). */
export function formatMoneyCompact(amount: number, currency = "THB") {
  return formatMoneyWithDisplay(amount, currency, "narrowSymbol");
}

function activeUiLocale(explicit?: Locale): Locale {
  if (explicit && isLocale(explicit)) return explicit;
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang?.slice(0, 2).toLowerCase();
    if (isLocale(lang)) return lang;
  }
  return "en";
}

/** Short display date in the active UI language (e.g. RU → «31 авг.» not «31 Aug»). */
export function formatShortDate(
  date: string | null | undefined,
  locale?: Locale,
) {
  return formatShortDateLocalized(date, activeUiLocale(locale));
}

export function formatDayLabel(date: Date, locale?: Locale) {
  return formatWeekdayShort(date, activeUiLocale(locale));
}

export function formatDisplayDate(
  date: Date | string,
  locale?: Locale,
  pattern = "d MMM yyyy",
) {
  const loc = activeUiLocale(locale);
  const d = typeof date === "string" ? parseISO(date) : date;
  const ruSafe =
    loc === "ru" || loc === "de" ? pattern.replace("MMM d, yyyy", "d MMM yyyy") : pattern;
  return format(d, ruSafe, { locale: getDateFnsLocale(loc) });
}

export function phoneToWaMe(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function lineDeepLink(handle: string) {
  const clean = handle.replace(/^@/, "");
  return `https://line.me/R/ti/p/~${clean}`;
}

export function weekDayRange(days = 5) {
  const today = startOfDay(new Date());
  return Array.from({ length: days }, (_, i) => subDays(today, days - 1 - i));
}

export function weeklyTaskOps(tasks: Task[], days = 5, locale: Locale = "en") {
  const range = weekDayRange(days);
  return range.map((day) => {
    const opened = tasks.filter((t) =>
      isSameDay(parseISO(t.created_at), day),
    ).length;
    const closed = tasks.filter(
      (t) => t.completed_at && isSameDay(parseISO(t.completed_at), day),
    ).length;
    return {
      day: formatWeekdayShort(day, locale),
      date: day,
      opened,
      closed,
      isToday: isToday(day),
    };
  });
}

export function greetingName(fullName: string) {
  return fullName.split(" ")[0] || fullName;
}

/** Ensure map/location links open reliably. */
export function normalizeLocationUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("maps:") || trimmed.startsWith("geo:")) return trimmed;
  return `https://${trimmed}`;
}

export function isValidLocationUrl(url: string) {
  const normalized = normalizeLocationUrl(url);
  if (!normalized) return false;
  try {
    // eslint-disable-next-line no-new
    new URL(normalized);
    return true;
  } catch {
    return /^maps:|^geo:/i.test(normalized);
  }
}
