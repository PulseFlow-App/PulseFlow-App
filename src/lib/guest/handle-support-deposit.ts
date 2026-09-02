import type { GuestDeposit, Profile } from "@/lib/types";
import { normalizeBillCurrency, DEFAULT_BILL_CURRENCY } from "@/lib/billing/currencies";
import { formatMoney } from "@/lib/utils";
import {
  parseDepositCommand,
  SUPPORT_SYSTEM_PREFIX,
  type ParsedDepositCommand,
} from "@/lib/guest/support-deposit-command";
import { makeNotification } from "@/lib/notifications";

export type SupportDepositAction =
  | {
      kind: "guest_signal";
      displayBody: string;
      notifications: ReturnType<typeof makeNotification>[];
    }
  | {
      kind: "host_confirm";
      displayBody: string;
      deposit: {
        amount: number;
        currency: string;
        notes: string | null;
        deposit_timing: GuestDeposit["deposit_timing"];
      };
      notifications: ReturnType<typeof makeNotification>[];
    };

export function resolveSupportDepositAction(input: {
  body: string;
  profile: Profile;
  stay: { id: string; org_id: string; guest_profile_id: string };
  deposit: GuestDeposit | undefined;
  ownerManagerIds: string[];
}): SupportDepositAction | null {
  const cmd = parseDepositCommand(input.body, input.profile.role);
  if (!cmd) return null;

  if (cmd.kind === "guest_signal") {
    const amountLine =
      input.deposit && input.deposit.status === "due"
        ? formatMoney(Number(input.deposit.amount), input.deposit.currency)
        : null;
    return {
      kind: "guest_signal",
      displayBody: amountLine
        ? `/deposit — ${amountLine}`
        : "/deposit",
      notifications: [
        makeNotification({
          org_id: input.stay.org_id,
          kind: "guest_update",
          title: "Guest sent /deposit",
          body: amountLine
            ? `${input.profile.full_name} is ready to pay ${amountLine}. Open Support and reply with /deposit when received.`
            : `${input.profile.full_name} sent /deposit in Support chat.`,
          href: "/messages",
          entity_id: input.stay.id,
          audience_profile_ids: input.ownerManagerIds,
        }),
      ],
    };
  }

  const amount =
    cmd.amount ??
    (input.deposit ? Number(input.deposit.amount) : null);
  const currency = normalizeBillCurrency(
    cmd.currency ??
      input.deposit?.currency ??
      DEFAULT_BILL_CURRENCY,
  );
  if (amount == null || !Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Enter /deposit with an amount, or set a deposit on the quote first.",
    );
  }

  const displayBody = `${SUPPORT_SYSTEM_PREFIX}Deposit recorded: ${formatMoney(amount, currency)}`;
  return {
    kind: "host_confirm",
    displayBody,
    deposit: {
      amount,
      currency,
      notes: input.deposit?.notes ?? null,
      deposit_timing: input.deposit?.deposit_timing ?? null,
    },
    notifications: [
      makeNotification({
        org_id: input.stay.org_id,
        kind: "guest_update",
        title: "Deposit received",
        body: `${formatMoney(amount, currency)} recorded for your stay`,
        href: "/home",
        entity_id: input.stay.id,
        audience_profile_ids: [input.stay.guest_profile_id],
      }),
    ],
  };
}

export function depositTimingLabelKey(
  timing: GuestDeposit["deposit_timing"],
): string | null {
  if (!timing) return null;
  return `guest.depositTiming.${timing}`;
}
