import type { DepositTiming, GuestDeposit, StayDateRequest } from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";

/** Owner payment instructions, or a short timing fallback. */
export function depositHowToPayCopy(input: {
  notes?: string | null;
  timing?: DepositTiming | null;
}): { kind: "notes"; text: string } | { kind: "fallback"; key: MessageKey } {
  const notes = input.notes?.trim();
  if (notes) return { kind: "notes", text: notes };
  if (input.timing === "on_arrival") {
    return { kind: "fallback", key: "guest.depositHowToPayOnArrival" };
  }
  return { kind: "fallback", key: "guest.depositHowToPayWait" };
}

export function depositHowToPayFromDeposit(deposit: GuestDeposit) {
  return depositHowToPayCopy({
    notes: deposit.notes,
    timing: deposit.deposit_timing,
  });
}

export function depositHowToPayFromQuote(request: StayDateRequest) {
  return depositHowToPayCopy({
    notes: request.payment_note,
    timing: request.quoted_deposit_timing,
  });
}
