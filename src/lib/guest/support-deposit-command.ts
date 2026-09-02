import { normalizeBillCurrency } from "@/lib/billing/currencies";

/** Prefix for auto-generated support messages (styled in chat UI). */
export const SUPPORT_SYSTEM_PREFIX = "⚡ ";

export type DepositTiming = "before_arrival" | "on_arrival";

export type ParsedDepositCommand =
  | { kind: "guest_signal" }
  | { kind: "host_confirm"; amount: number | null; currency: string | null };

const GUEST_DEPOSIT_RE = /^\/deposit\s*$/i;
const HOST_DEPOSIT_RE = /^\/deposit(?:\s+([\d.,]+))?(?:\s+([A-Za-z]{3}))?\s*$/i;

export function parseDepositCommand(
  body: string,
  role: "guest" | "owner" | "manager" | "staff" | string | undefined,
): ParsedDepositCommand | null {
  const trimmed = body.trim();
  if (role === "guest") {
    if (GUEST_DEPOSIT_RE.test(trimmed)) return { kind: "guest_signal" };
    return null;
  }
  if (role === "owner" || role === "manager") {
    const match = trimmed.match(HOST_DEPOSIT_RE);
    if (!match) return null;
    const rawAmount = match[1]?.replace(/,/g, "");
    const amount =
      rawAmount && Number.isFinite(Number(rawAmount)) && Number(rawAmount) > 0
        ? Number(rawAmount)
        : null;
    const currency = match[2] ? normalizeBillCurrency(match[2]) : null;
    return { kind: "host_confirm", amount, currency };
  }
  return null;
}

export function isSupportSystemMessage(body: string): boolean {
  return body.startsWith(SUPPORT_SYSTEM_PREFIX);
}
