import type { BillCurrency } from "./currencies";

/** Approximate USD value of 1 unit (for display totals only). */
const TO_USD: Record<BillCurrency, number> = {
  USD: 1,
  THB: 1 / 34,
  EUR: 1.08,
  GBP: 1.27,
  AUD: 0.65,
  SGD: 0.74,
  MYR: 0.22,
  IDR: 1 / 15800,
  PHP: 1 / 56,
  VND: 1 / 25400,
  AED: 0.27,
  SAR: 1 / 3.75,
  MAD: 1 / 10,
  ILS: 0.27,
  JPY: 1 / 149,
  CNY: 0.14,
  INR: 1 / 83,
  CHF: 1.12,
  CAD: 0.72,
  NZD: 0.6,
};

/** Convert a stored bill amount into the chosen display currency. */
export function convertBillAmount(
  amount: number,
  from: BillCurrency,
  to: BillCurrency,
): number {
  if (!Number.isFinite(amount) || from === to) return amount;
  const usd = amount * TO_USD[from];
  const converted = usd / TO_USD[to];
  const decimals = to === "JPY" || to === "VND" || to === "IDR" ? 0 : 2;
  const factor = 10 ** decimals;
  return Math.round(converted * factor) / factor;
}
