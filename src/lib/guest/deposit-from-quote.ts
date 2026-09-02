import type { DepositTiming, GuestDeposit, StayDateRequest } from "@/lib/types";
import { normalizeBillCurrency } from "@/lib/billing/currencies";

export function depositTimingFromQuote(
  request: StayDateRequest,
): DepositTiming | null {
  if (request.quoted_deposit_timing) return request.quoted_deposit_timing;
  if (request.quoted_deposit_amount && request.quoted_deposit_amount > 0) {
    return "before_arrival";
  }
  return null;
}

export function buildDueDepositFromRequest(
  request: StayDateRequest,
  stayId: string,
  createId: () => string,
): GuestDeposit | null {
  const amount = request.quoted_deposit_amount;
  const currency = request.quoted_deposit_currency;
  if (amount == null || !currency || amount <= 0) return null;
  const timing = depositTimingFromQuote(request);
  return {
    id: createId(),
    org_id: request.org_id,
    stay_id: stayId,
    amount: Number(amount),
    currency: normalizeBillCurrency(currency),
    status: "due",
    refunded_amount: 0,
    notes: request.payment_note,
    deposit_timing: timing,
    created_at: new Date().toISOString(),
  };
}

export function isDepositPaid(deposit: GuestDeposit | null | undefined): boolean {
  return !!deposit && deposit.status !== "due";
}
