import { normalizeBillCurrency } from "@/lib/billing/currencies";

export type ParsedRefundCommand = {
  kind: "host_refund";
  amount: number | null;
  currency: string | null;
};

const HOST_REFUND_RE = /^\/refund(?:\s+([\d.,]+))?(?:\s+([A-Za-z]{3}))?\s*$/i;

export function parseRefundCommand(
  body: string,
  role: "guest" | "owner" | "manager" | "staff" | string | undefined,
): ParsedRefundCommand | null {
  if (role !== "owner" && role !== "manager") return null;
  const trimmed = body.trim();
  const match = trimmed.match(HOST_REFUND_RE);
  if (!match) return null;
  const rawAmount = match[1]?.replace(/,/g, "");
  const amount =
    rawAmount && Number.isFinite(Number(rawAmount)) && Number(rawAmount) > 0
      ? Number(rawAmount)
      : null;
  const currency = match[2] ? normalizeBillCurrency(match[2]) : null;
  return { kind: "host_refund", amount, currency };
}
