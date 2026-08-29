import type {
  BillCategory,
  BillStatus,
  CleaningStatus,
  Messenger,
  OrgKind,
  TaskPriority,
  TaskStatus,
  UserRole,
  VillaStatus,
} from "./design-tokens";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export type Organization = {
  id: string;
  name: string;
  kind: OrgKind;
  created_at: string;
  trial_ends_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: SubscriptionStatus;
  billing_email?: string | null;
  referral_bonus_ends_at?: string | null;
  referral_year_claimed?: boolean;
};

export type Profile = {
  id: string;
  /** Active company (or personal workspace if they only work solo). */
  org_id: string;
  /**
   * Personal workspace for side villas not owned by the company.
   * Kept when the user later joins a company via invite.
   */
  personal_org_id: string | null;
  role: UserRole;
  full_name: string;
  phone: string | null;
  email: string;
  job_title: string | null;
  /** Public slug for shareable reputation page */
  share_slug: string;
  /** Opt-in listing in the talent directory for owners/managers to discover staff */
  job_search_visible: boolean;
  job_search_skills: string[];
  job_search_bio: string | null;
  /** City / area label for talent search, e.g. "Koh Samui" */
  job_search_location: string | null;
  /** Country label for talent search, e.g. "Thailand" */
  job_search_country: string | null;
  job_search_lat: number | null;
  job_search_lng: number | null;
  job_search_updated_at: string | null;
};

export type OrgMembership = {
  id: string;
  org_id: string;
  profile_id: string;
  role: UserRole;
  joined_at: string;
};

/** Owner -> employee weekly star vote (1-5). One per owner/employee/week/org. */
export type Endorsement = {
  id: string;
  org_id: string;
  from_profile_id: string;
  to_profile_id: string;
  stars: 1 | 2 | 3 | 4 | 5;
  week_key: string;
  note: string | null;
  created_at: string;
};

export type Invite = {
  id: string;
  token: string;
  org_id: string;
  role: Exclude<UserRole, "owner">;
  /** Set by invitee when they accept */
  full_name: string | null;
  email: string | null;
  phone: string | null;
  /** Set by inviter */
  job_title: string | null;
  created_by: string;
  created_at: string;
  used_at: string | null;
  used_by: string | null;
};

export type VillaAssignment = {
  id: string;
  org_id: string;
  villa_id: string;
  profile_id: string;
};

export type DemoAccount = {
  email: string;
  password: string;
  profileId: string;
};

export type Villa = {
  id: string;
  org_id: string;
  name: string;
  area: string | null;
  /** Precise map link (Google Maps, Apple Maps, etc.) */
  location_url: string | null;
  /** Optional longer description of the property */
  description: string | null;
  /** Exterior / facade photo so staff can recognize the place */
  photo_url: string | null;
  status: VillaStatus;
  check_in: string | null;
  check_out: string | null;
  cleaning_status: CleaningStatus;
  notes: string | null;
  created_by: string | null;
  updated_at: string;
};

export type VillaBucket = "company" | "personal";

export type VillaListItem = Villa & {
  bucket: VillaBucket;
  orgLabel: string;
};

export type Contact = {
  id: string;
  org_id: string;
  name: string;
  role: string;
  phone: string | null;
  messenger: Messenger;
  messenger_handle: string | null;
  notes: string | null;
  /** When set, bookings notify this PulseFlow user for Read & agreed. */
  linked_profile_id: string | null;
};

export type ServiceOrderStatus =
  | "pending_ack"
  | "agreed"
  | "done"
  | "cancelled";

/** Owner/manager books a vendor/staff for a timed job at a villa. */
export type ServiceOrder = {
  id: string;
  org_id: string;
  contact_id: string | null;
  staff_profile_id: string | null;
  ordered_by: string;
  villa_id: string | null;
  location_label: string | null;
  service_type: string;
  details: string | null;
  scheduled_date: string;
  time_start: string | null;
  time_end: string | null;
  status: ServiceOrderStatus;
  agreed_at: string | null;
  chat_message_id: string | null;
  task_id: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  org_id: string;
  villa_id: string | null;
  title: string;
  priority: TaskPriority;
  assigned_to: string | null;
  status: TaskStatus;
  due_date: string | null;
  /** Work window HH:mm (staff-focused; not guest check-in). */
  time_start: string | null;
  time_end: string | null;
  created_by: string;
  created_at: string;
  completed_at: string | null;
  service_order_id: string | null;
};

export type Bill = {
  id: string;
  org_id: string;
  villa_id: string | null;
  description: string;
  amount: number;
  currency: string;
  status: BillStatus;
  /** Spend category tag for owner analytics */
  category: BillCategory;
  /** Optional payment / reimbursement due date (YYYY-MM-DD) */
  due_date: string | null;
  submitted_by: string;
  receipt_photo_url: string | null;
  created_at: string;
};

export type NotificationKind =
  | "check_in"
  | "check_out"
  | "urgent_task"
  | "task_assigned"
  | "task_completed"
  | "message"
  | "bill_due"
  | "bill_submitted"
  | "bill_paid"
  | "appointment"
  | "team_joined"
  | "endorsement";

export type AppNotification = {
  id: string;
  org_id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string | null;
  entity_id: string | null;
  /** null = everyone in the org */
  audience_profile_ids: string[] | null;
  /** Prevents duplicate schedule alerts */
  dedupe_key: string | null;
  created_at: string;
  read_by: string[];
};

export type Message = {
  id: string;
  org_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  service_order_id: string | null;
};

export type TaskWithRelations = Task & {
  villa?: Pick<Villa, "id" | "name"> | null;
  assignee?: Pick<Profile, "id" | "full_name"> | null;
};

export type BillWithRelations = Bill & {
  villa?: Pick<Villa, "id" | "name"> | null;
  submitter?: Pick<Profile, "id" | "full_name"> | null;
};

export type MessageWithSender = Message & {
  sender?: Pick<Profile, "id" | "full_name" | "role"> | null;
};

export type HandoffSnapshot = {
  id: string;
  org_id: string;
  created_by: string;
  label: string;
  payload: Record<string, unknown>;
  created_at: string;
};

/** Guest stay record (one booking / visit). */
export type GuestStayStatus = "upcoming" | "active" | "completed";

export type GuestStay = {
  id: string;
  org_id: string;
  villa_id: string;
  guest_profile_id: string;
  check_in: string;
  check_out: string;
  status: GuestStayStatus;
  owner_notices: string | null;
  created_at: string;
};

/** Owner-editable house guide per villa. */
export type HouseGuide = {
  id: string;
  org_id: string;
  villa_id: string;
  wifi_ssid: string | null;
  wifi_password: string | null;
  gate_code: string | null;
  bins_notes: string | null;
  quiet_hours: string | null;
  checkout_checklist: string | null;
  extra_notes: string | null;
  updated_at: string;
};

/** Support chat: guest ↔ owner/manager only (one thread per stay). */
export type SupportMessage = {
  id: string;
  org_id: string;
  stay_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type SupportMessageWithSender = SupportMessage & {
  sender?: Pick<Profile, "id" | "full_name" | "role"> | null;
};

export type GuestDepositStatus = "held" | "partial" | "refunded";

export type GuestDeposit = {
  id: string;
  org_id: string;
  stay_id: string;
  amount: number;
  currency: string;
  status: GuestDepositStatus;
  refunded_amount: number;
  notes: string | null;
  created_at: string;
};

export type GuestCharge = {
  id: string;
  org_id: string;
  stay_id: string;
  deposit_id: string | null;
  description: string;
  amount: number;
  currency: string;
  proof_photo_url: string | null;
  created_at: string;
};

export type StayPhotoKind = "arrival" | "departure";

export type StayPhoto = {
  id: string;
  org_id: string;
  stay_id: string;
  kind: StayPhotoKind;
  photo_url: string;
  note: string | null;
  uploaded_by: string;
  created_at: string;
};

export type StayDateRequestStatus = "pending" | "accepted" | "declined";

export type StayDateRequest = {
  id: string;
  org_id: string;
  villa_id: string;
  guest_profile_id: string;
  check_in: string;
  check_out: string;
  note: string | null;
  status: StayDateRequestStatus;
  created_at: string;
};
