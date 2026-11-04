/** Stored on service_requests.reply_message when staff agree. Not shown as a chat reply. */
export const AGREED_REPLY = "agreed";

export function isAgreedReply(message: string | null | undefined) {
  return Boolean(message && message.trim());
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
  created_at: string;
  replied_at: string | null;
};
