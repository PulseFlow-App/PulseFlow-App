import type { GuestDeposit, Profile } from "@/lib/types";
import {
  normalizeBillCurrency,
  DEFAULT_BILL_CURRENCY,
} from "@/lib/billing/currencies";
import { formatMoney } from "@/lib/utils";
import { parseRefundCommand } from "@/lib/guest/support-refund-command";
import { SUPPORT_SYSTEM_PREFIX } from "@/lib/guest/support-deposit-command";
import { makeNotification } from "@/lib/notifications";

export function refundableDepositBalance(
  deposit: GuestDeposit | null | undefined,
): number {
  if (!deposit) return 0;
  if (deposit.status === "due" || deposit.status === "refunded") return 0;
  return Math.max(0, Number(deposit.amount) - Number(deposit.refunded_amount));
}

export type SupportRefundAction = {
  kind: "host_refund";
  displayBody: string;
  deposit: {
    refunded_amount: number;
    status: "partial" | "refunded";
  };
  notifications: ReturnType<typeof makeNotification>[];
};

export function resolveSupportRefundAction(input: {
  body: string;
  profile: Profile;
  stay: { id: string; org_id: string; guest_profile_id: string };
  deposit: GuestDeposit | undefined;
  hasAttachment?: boolean;
}): SupportRefundAction | null {
  const cmd = parseRefundCommand(input.body, input.profile.role);
  if (!cmd) return null;

  const deposit = input.deposit;
  if (!deposit || deposit.status === "due") {
    throw new Error(
      "No paid deposit to refund. Record the deposit with /deposit first.",
    );
  }

  const remaining = refundableDepositBalance(deposit);
  if (remaining <= 0) {
    throw new Error("This deposit is already fully refunded.");
  }

  const amount = cmd.amount ?? remaining;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter /refund with a valid amount, e.g. /refund 5000 THB.");
  }
  if (amount > remaining + 0.001) {
    throw new Error(
      `Refund cannot exceed the remaining deposit (${formatMoney(remaining, deposit.currency)}).`,
    );
  }

  const currency = normalizeBillCurrency(
    cmd.currency ?? deposit.currency ?? DEFAULT_BILL_CURRENCY,
  );
  const nextRefunded = Number(deposit.refunded_amount) + amount;
  const fullyRefunded = nextRefunded >= Number(deposit.amount) - 0.001;
  const status = fullyRefunded ? ("refunded" as const) : ("partial" as const);
  const money = formatMoney(amount, currency);
  const displayBody = fullyRefunded
    ? `${SUPPORT_SYSTEM_PREFIX}Deposit refunded: ${money}${input.hasAttachment ? " (proof attached)" : ""}`
    : `${SUPPORT_SYSTEM_PREFIX}Partial refund recorded: ${money}${input.hasAttachment ? " (proof attached)" : ""}`;

  return {
    kind: "host_refund",
    displayBody,
    deposit: {
      refunded_amount: Math.min(nextRefunded, Number(deposit.amount)),
      status,
    },
    notifications: [
      makeNotification({
        org_id: input.stay.org_id,
        kind: "guest_update",
        title: fullyRefunded ? "Deposit refunded" : "Partial deposit refund",
        body: `${money} refunded to you${input.hasAttachment ? ". Proof is in Support chat." : "."}`,
        href: "/bills",
        entity_id: input.stay.id,
        audience_profile_ids: [input.stay.guest_profile_id],
      }),
    ],
  };
}
