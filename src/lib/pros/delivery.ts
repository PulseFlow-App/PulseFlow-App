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
