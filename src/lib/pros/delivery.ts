/** Stored on service_requests.reply_message when the customer accepts a quote. Not shown as a chat reply. */
export const AGREED_REPLY = "agreed";

export function isAgreedReply(message: string | null | undefined) {
  return message?.trim() === AGREED_REPLY;
}

const WHEN_TIMES: Record<string, string> = {
  morning: "09:00",
  afternoon: "13:00",
  evening: "17:00",
  any: "09:00",
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoDay(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Milliseconds for the visit, or null when the label has no day. Undated rows sort last. */
export function deliveryWhenTime(whenLabel: string | null | undefined, now = new Date()) {
  const parts = (whenLabel ?? "")
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  let date: string | null = null;
  let time = "09:00";
  for (const part of parts) {
    const token = part.toLowerCase();
    if (/^\d{4}-\d{2}-\d{2}/.test(part)) date = part.slice(0, 10);
    else if (token === "today") date = isoDay(now);
    else if (token === "tomorrow") {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      date = isoDay(next);
    } else if (token === "this_week" || token === "this week" || token === "flexible") {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      date = isoDay(next);
    } else if (WHEN_TIMES[token]) time = WHEN_TIMES[token];
    else if (/^\d{1,2}:\d{2}/.test(part)) {
      const [hour, minute] = part.split(":");
      time = `${pad2(Number(hour))}:${minute.slice(0, 2)}`;
    }
  }
  if (!date) return null;
  const stamp = new Date(`${date}T${time}:00`).getTime();
  return Number.isNaN(stamp) ? null : stamp;
}

/** Confirmed appointments first, then open requests. Each group is earliest visit first. */
export function compareDeliveries(a: ServiceDelivery, b: ServiceDelivery, now = new Date()) {
  const rank = (row: ServiceDelivery) => {
    if (row.cancelled_at) return 2;
    if (isAgreedReply(row.reply_message)) return 0;
    return 1;
  };
  const byState = rank(a) - rank(b);
  if (byState !== 0) return byState;
  const left = deliveryWhenTime(a.when_label, now);
  const right = deliveryWhenTime(b.when_label, now);
  if (left == null && right != null) return 1;
  if (left != null && right == null) return -1;
  if (left != null && right != null && left !== right) return left - right;
  return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
}

export const CANCEL_REASONS = ["schedule", "price", "scope", "not_needed", "other"] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];

export function isCancelReason(value: string | null | undefined): value is CancelReason {
  return CANCEL_REASONS.includes(value as CancelReason);
}

/** First line is the reason key. Anything after it is the optional note. */
export function splitCancelReason(raw: string | null | undefined) {
  const [key, ...rest] = (raw ?? "").split("\n");
  const note = rest.join("\n").trim();
  return {
    key: isCancelReason(key) ? key : null,
    note: note || null,
  };
}

export function quoteLabel(row: {
  reply_amount?: number | null;
  quote_max?: number | null;
  reply_currency?: string | null;
}) {
  if (row.reply_amount == null) return null;
  const currency = row.reply_currency?.trim() || "THB";
  const max = row.quote_max;
  if (max != null && max !== row.reply_amount) return `${row.reply_amount}–${max} ${currency}`;
  return `${row.reply_amount} ${currency}`;
}

export type ServiceDelivery = {
  id: string;
  request_id: string;
  created_by: string;
  target_profile_id: string;
  target_name: string;
  title: string;
  description: string;
  when_label: string | null;
  area_label?: string | null;
  /** Exact location. Omitted for staff until the quote is accepted. */
  share_location?: string | null;
  reply_message: string | null;
  reply_amount: number | null;
  reply_currency: string | null;
  quote_max?: number | null;
  photos?: string[] | null;
  accepted_at?: string | null;
  quote_note?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancel_reason?: string | null;
  created_at: string;
  replied_at: string | null;
};
