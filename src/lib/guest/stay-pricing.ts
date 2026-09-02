import { normalizeBillCurrency } from "@/lib/billing/currencies";

export type StayDateRequestPricing = {
  quoted_price_amount: number;
  quoted_price_currency: string;
  quoted_deposit_amount?: number | null;
  quoted_deposit_currency?: string | null;
  quoted_deposit_timing?: import("@/lib/types").DepositTiming | null;
  payment_note?: string | null;
};

export function parseQuotedDeposit(
  pricing: StayDateRequestPricing | undefined,
  priceCurrency: string,
): { amount: number | null; currency: string | null } {
  if (!pricing) return { amount: null, currency: null };
  const raw = pricing.quoted_deposit_amount;
  if (raw == null || !Number.isFinite(Number(raw)) || Number(raw) <= 0) {
    return { amount: null, currency: null };
  }
  return {
    amount: Number(raw),
    currency: normalizeBillCurrency(pricing.quoted_deposit_currency ?? priceCurrency),
  };
}

export function formatDepositQuoteLine(amount: number, currency: string): string {
  const money = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
  return `${money} deposit requested`;
}

export function formatStayQuoteLine(input: {
  amount: number;
  currency: string;
  checkIn: string;
  checkOut: string;
}): string {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const money = new Intl.NumberFormat("en", {
    style: "currency",
    currency: input.currency,
    maximumFractionDigits: input.currency === "JPY" ? 0 : 2,
  }).format(input.amount);
  return `${money} total · ${nights} night${nights === 1 ? "" : "s"} (${input.checkIn} → ${input.checkOut})`;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T12:00:00`);
  const end = new Date(`${checkOut}T12:00:00`);
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
}
