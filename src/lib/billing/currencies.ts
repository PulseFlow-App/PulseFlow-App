/** Currencies available when logging bills (ISO 4217). */
export const BILL_CURRENCIES = [
  "THB",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "SGD",
  "MYR",
  "IDR",
  "PHP",
  "VND",
  "AED",
  "SAR",
  "MAD",
  "ILS",
  "JPY",
  "CNY",
  "INR",
  "CHF",
  "CAD",
  "NZD",
] as const;

export type BillCurrency = (typeof BILL_CURRENCIES)[number];

export const DEFAULT_BILL_CURRENCY: BillCurrency = "THB";

const STORAGE_KEY = "pulseflow.bills.currency";

export function isBillCurrency(value: string): value is BillCurrency {
  return (BILL_CURRENCIES as readonly string[]).includes(value);
}

export function normalizeBillCurrency(
  value: string | null | undefined,
): BillCurrency {
  const code = value?.trim().toUpperCase() ?? "";
  return isBillCurrency(code) ? code : DEFAULT_BILL_CURRENCY;
}

export function readPreferredBillCurrency(): BillCurrency {
  if (typeof window === "undefined") return DEFAULT_BILL_CURRENCY;
  try {
    return normalizeBillCurrency(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_BILL_CURRENCY;
  }
}

export const DISPLAY_CURRENCY_EVENT = "pulseflow:display-currency-changed";

export function rememberPreferredBillCurrency(currency: BillCurrency) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, currency);
    window.dispatchEvent(new Event(DISPLAY_CURRENCY_EVENT));
  } catch {
    /* ignore */
  }
}

/** Short label for selects, e.g. "THB (฿)". */
export function billCurrencyLabel(code: BillCurrency) {
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const symbol = parts.find((p) => p.type === "currency")?.value ?? code;
    return symbol === code ? code : `${code} (${symbol})`;
  } catch {
    return code;
  }
}
