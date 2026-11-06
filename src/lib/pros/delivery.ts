/** Stored on service_requests.reply_message when the customer accepts a quote. Not shown as a chat reply. */
export const AGREED_REPLY = "agreed";

export function isAgreedReply(message: string | null | undefined) {
  return message?.trim() === AGREED_REPLY;
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
  reply_message: string | null;
  reply_amount: number | null;
  reply_currency: string | null;
  quote_max?: number | null;
  photos?: string[] | null;
  accepted_at?: string | null;
  created_at: string;
  replied_at: string | null;
};
