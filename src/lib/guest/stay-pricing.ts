/** Default payment instructions when owner confirms a date request. */
export const DEFAULT_IN_PERSON_PAYMENT_NOTE =
  "Payment in person at check-in (cash or bank transfer). Message your host in Support if you need payment details.";

export type StayDateRequestPricing = {
  quoted_price_amount: number;
  quoted_price_currency: string;
  payment_note?: string | null;
};

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
