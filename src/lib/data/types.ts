import type {
  AppNotification,
  Bill,
  BillWithRelations,
  Contact,
  Endorsement,
  GuestBriefing,
  GuestBriefingCategory,
  GuestCharge,
  GuestDeposit,
  GuestStay,
  HouseGuide,
  Invite,
  MessageWithSender,
  OrgMembership,
  Organization,
  Profile,
  ServiceOrder,
  StayDateRequest,
  StayPhoto,
  SupportMessageWithSender,
  TaskWithRelations,
  Villa,
  VillaAssignment,
  VillaListItem,
} from "@/lib/types";
import type { BillStatus, TaskPriority, TaskStatus, UserRole } from "@/lib/design-tokens";
import type { BillCategory } from "@/lib/design-tokens";

export type AppData = {
  ready: boolean;
  profile: Profile | null;
  organization: Organization | null;
  companyEntitled: boolean;
  orgName: string;
  orgKind: "personal" | "company" | null;
  profiles: Profile[];
  /** All profiles in the demo/db (for multi-company leaderboards). */
  allProfiles: Profile[];
  orgs: Organization[];
  villas: Villa[];
  villaList: VillaListItem[];
  allOrgVillas: Villa[];
  contacts: Contact[];
  tasks: TaskWithRelations[];
  bills: BillWithRelations[];
  messages: MessageWithSender[];
  invites: Invite[];
  villaAssignments: VillaAssignment[];
  memberships: OrgMembership[];
  endorsements: Endorsement[];
  notifications: AppNotification[];
  serviceOrders: ServiceOrder[];
  unreadNotificationCount: number;
  unreadMessageCount: number;
  /** Guest stay loop */
  guestStays: GuestStay[];
  activeStay: GuestStay | null;
  houseGuides: HouseGuide[];
  supportMessages: SupportMessageWithSender[];
  guestDeposits: GuestDeposit[];
  guestCharges: GuestCharge[];
  stayPhotos: StayPhoto[];
  stayDateRequests: StayDateRequest[];
  guestBriefings: GuestBriefing[];
  refresh: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  /** Mark all visible unread as read. Pass kind to limit (e.g. message badges). */
  markAllNotificationsRead: (kind?: AppNotification["kind"]) => Promise<void>;
  createServiceOrder: (input: {
    contact_id: string;
    villa_id: string | null;
    location_label?: string | null;
    service_type: string;
    details?: string | null;
    scheduled_date: string;
    time_start?: string | null;
    time_end?: string | null;
  }) => Promise<ServiceOrder>;
  agreeServiceOrder: (orderId: string) => Promise<void>;
  cancelServiceOrder: (orderId: string) => Promise<void>;
  completeServiceOrder: (orderId: string) => Promise<void>;
  updateVilla: (
    id: string,
    patch: Partial<
      Pick<
        Villa,
        | "status"
        | "check_in"
        | "check_out"
        | "cleaning_status"
        | "notes"
        | "name"
        | "area"
        | "location_url"
        | "description"
        | "photo_url"
      >
    >,
  ) => Promise<void>;
  createVilla: (input: {
    name: string;
    area?: string;
    location_url: string;
    description?: string;
    photo_url?: string | null;
    status?: Villa["status"];
    /** Owners default to company; managers default to personal side work. */
    scope?: "company" | "personal";
  }) => Promise<void>;
  deleteVilla: (id: string) => Promise<void>;
  mergeVillaToCompany: (villaId: string) => Promise<void>;
  updateOrganizationName: (name: string) => Promise<void>;
  /** Any signed-in user can update their own display name. */
  updateProfileName: (name: string) => Promise<void>;
  createTask: (input: {
    title: string;
    villa_id: string | null;
    priority: TaskPriority;
    assigned_to: string | null;
    due_date: string | null;
    time_start?: string | null;
    time_end?: string | null;
  }) => Promise<void>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  createContact: (input: Omit<Contact, "id" | "org_id">) => Promise<void>;
  updateContact: (
    id: string,
    patch: Partial<Omit<Contact, "id" | "org_id">>,
  ) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  createBill: (input: {
    description: string;
    amount: number;
    currency?: string;
    villa_id: string | null;
    category?: BillCategory;
    due_date?: string | null;
    receipt_photo_url?: string | null;
  }) => Promise<void>;
  setBillStatus: (id: string, status: BillStatus) => Promise<void>;
  sendMessage: (body: string) => Promise<void>;
  uploadReceipt: (file: File) => Promise<string | null>;
  uploadVillaPhoto: (file: File) => Promise<string | null>;
  createInvite: (input: {
    role: Exclude<UserRole, "owner">;
    jobTitle?: string;
  }) => Promise<Invite>;
  setVillaAssignments: (managerId: string, villaIds: string[]) => Promise<void>;
  setVillaAssignees: (villaId: string, profileIds: string[]) => Promise<void>;
  castEndorsement: (
    toProfileId: string,
    stars: 1 | 2 | 3 | 4 | 5,
    note?: string,
  ) => Promise<void>;
  sendSupportMessage: (body: string, stayId?: string) => Promise<void>;
  createGuestBriefing: (input: {
    stay_id: string;
    title: string;
    body: string;
    category?: GuestBriefingCategory;
  }) => Promise<void>;
  confirmGuestBriefing: (briefingId: string) => Promise<void>;
  /** Owner/manager records or updates the security deposit held for a stay. */
  upsertGuestDeposit: (input: {
    stay_id: string;
    amount: number;
    currency?: string;
    notes?: string | null;
  }) => Promise<void>;
  /** Owner/manager cancels an upcoming or active guest stay. */
  cancelGuestStay: (stayId: string) => Promise<void>;
  upsertHouseGuide: (
    villaId: string,
    patch: Partial<
      Omit<HouseGuide, "id" | "org_id" | "villa_id" | "updated_at">
    >,
  ) => Promise<void>;
  requestStayDates: (input: {
    villa_id: string;
    check_in: string;
    check_out: string;
    note?: string | null;
    guest_price_amount?: number | null;
    guest_price_currency?: string | null;
  }) => Promise<void>;
  respondStayDateRequest: (
    requestId: string,
    decision: "accepted" | "declined",
    pricing?: import("@/lib/guest/stay-pricing").StayDateRequestPricing,
  ) => Promise<void>;
  addStayPhoto: (input: {
    kind: StayPhoto["kind"];
    photo_url: string;
    note?: string | null;
  }) => Promise<void>;
};
