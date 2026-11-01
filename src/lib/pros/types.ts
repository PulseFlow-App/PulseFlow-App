export type ProsLang = "en" | "th" | "ru" | "he";

export type ProsStatus =
  | "requested"
  | "offers_received"
  | "chosen"
  | "scheduled"
  | "in_progress"
  | "awaiting_approval"
  | "completed"
  | "cancelled";

export type ProsUrgency = "today" | "this_week" | "flexible";

export type ProCheck = "email" | "phone" | "identity" | "business" | "qualification";

export type ProProfile = {
  id: string;
  contactId: string | null;
  orgId: string | null;
  linkedProfileId: string | null;
  name: string;
  description: string;
  descriptionLocale: string;
  translations: Record<string, string>;
  photoUrl: string | null;
  photos: string[];
  categoryIds: string[];
  areaIds: string[];
  languages: string[];
  phone: string | null;
  lineId: string | null;
  whatsapp: string | null;
  visibility: "private" | "public";
  status: "active" | "suspended";
  available: boolean;
  consentAt: string | null;
  consentBy: string | null;
  consentNote: string | null;
  claimToken: string;
  claimedAt: string | null;
  listingTier: "free";
  checks: Record<ProCheck, string | null>;
  createdAt: string;
};

export type ProRequest = {
  id: string;
  createdBy: string;
  orgId: string | null;
  taskId: string | null;
  villaId: string | null;
  categoryId: string;
  title: string;
  description: string;
  originalLocale: string;
  translations: Record<string, string>;
  photos: string[];
  areaId: string | null;
  urgency: ProsUrgency;
  preferredTime: string;
  language: string | null;
  status: ProsStatus;
  /** direct = one chosen professional. open = anyone who matches. */
  source: "direct" | "open";
  invitedProfileId: string | null;
  chosenProfileId: string | null;
  finalAmount: number | null;
  finalCurrency: string | null;
  /** Set when the customer says they paid the professional directly. */
  paidAt: string | null;
  createdAt: string;
};

export type ProOffer = {
  id: string;
  requestId: string;
  profileId: string;
  token: string;
  amount: number | null;
  currency: string | null;
  message: string;
  originalLocale: string;
  translations: Record<string, string>;
  proposedTime: string | null;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

export type ProJob = {
  id: string;
  profileId: string;
  requestId: string | null;
  taskId: string | null;
  categoryId: string | null;
  completedAt: string;
};

export type ProReview = {
  id: string;
  profileId: string;
  requestId: string | null;
  taskId: string | null;
  authorId: string;
  stars: number;
  comment: string;
  /** Multiple-choice answers from the customer, including how the platform felt. */
  answers?: Record<string, string> | null;
  originalLocale: string;
  translations: Record<string, string>;
  createdAt: string;
};

export type ProReport = {
  id: string;
  target: "profile" | "review";
  targetId: string;
  reason: string;
  by: string | null;
  createdAt: string;
};

export type ProEvent = {
  id: string;
  name: string;
  actorId: string | null;
  ref: string | null;
  at: string;
};

export type ProsState = {
  version: 1;
  placeId: string | null;
  profiles: ProProfile[];
  requests: ProRequest[];
  offers: ProOffer[];
  jobs: ProJob[];
  reviews: ProReview[];
  reports: ProReport[];
  events: ProEvent[];
  categoriesExtra: { id: string; slug: string; icon: string; active: boolean; names: Record<string, string> }[];
  areasExtra: {
    id: string;
    slug: string;
    parentId: string | null;
    level: "country" | "region" | "locality" | "district";
    countryCode: string;
    names: Record<string, string>;
  }[];
  languageByUser: Record<string, string>;
  /** profile ids saved by each user. Not a ranking signal. */
  favourites: Record<string, string[]>;
};

export type ProsActor = {
  id: string;
  name: string;
  role: string;
  orgId: string | null;
};
