"use client";

import {
  createFreshDemoStore as createBaseDemoStore,
  DEMO_DEPOSIT_ID,
  type DemoStore,
} from "./seed-data";
import {
  enrichDemoVillas,
  extraBills,
  extraGuestBriefings,
  extraGuestCharges,
  extraGuestDeposits,
  extraGuestStays,
  extraHouseGuides,
  extraMessages,
  extraNotifications,
  extraServiceOrders,
  extraStayDateRequests,
  extraStayPhotos,
  extraSupportMessages,
  extraTasks,
  extraVillaAssignments,
} from "./seed-enrichment";
import {
  denseBills,
  denseGuestCharges,
  denseGuestDeposits,
  denseMessages,
  denseServiceOrders,
  denseTasks,
} from "./seed-density";
import type {
  AppNotification,
  DemoAccount,
  Endorsement,
  Invite,
  Organization,
  OrgMembership,
  Profile,
  ServiceOrder,
  Villa,
  VillaAssignment,
  VillaListItem,
} from "@/lib/types";
import type { OrgKind, UserRole } from "@/lib/design-tokens";
import { invitableStaffRoles, canInviteGuest, isStaffApp, isTaskAssignableRole, canBookServices } from "@/lib/roles";
import { weekKey } from "@/lib/endorsements";
import {
  buildEndorsementReceivedNotification,
  buildScheduleAlerts,
  formatWorkWindow,
  makeNotification,
  notificationVisibleTo,
  isChatBadgeNotification,
  ownerManagerIds,
} from "@/lib/notifications";
import { buildOrderChatBody, canCancelServiceOrder, canAgreeServiceOrder, canRevokeServiceOrderAgreement, canReopenServiceOrder, formatOrderWhen, parseCancelJobCommand, resolveCancelJobTarget } from "@/lib/service-orders";
import { capitalizeLabel } from "@/lib/format-label";
import { dateDrivenVillaPatch } from "@/lib/villas/status-from-dates";
import { normalizeVillaRow } from "@/lib/villas/property-details";
import { pickPrimaryRole } from "@/lib/auth/attach-org";

function createFreshDemoStore(): DemoStore {
  const base = createBaseDemoStore();
  return {
    ...base,
    villas: enrichDemoVillas(base.villas),
    tasks: [
      ...base.tasks,
      ...structuredClone(extraTasks),
      ...structuredClone(denseTasks),
    ],
    bills: [
      ...base.bills,
      ...structuredClone(extraBills),
      ...structuredClone(denseBills),
    ],
    messages: [
      ...base.messages,
      ...structuredClone(extraMessages),
      ...structuredClone(denseMessages),
    ],
    villaAssignments: [
      ...base.villaAssignments,
      ...structuredClone(extraVillaAssignments),
    ],
    notifications: [
      ...base.notifications,
      ...structuredClone(extraNotifications),
    ],
    serviceOrders: [
      ...base.serviceOrders,
      ...structuredClone(extraServiceOrders),
      ...structuredClone(denseServiceOrders),
    ],
    guestStays: [...base.guestStays, ...structuredClone(extraGuestStays)],
    houseGuides: [...base.houseGuides, ...structuredClone(extraHouseGuides)],
    supportMessages: [
      ...base.supportMessages,
      ...structuredClone(extraSupportMessages),
    ],
    guestBriefings: [
      ...base.guestBriefings,
      ...structuredClone(extraGuestBriefings),
    ],
    guestDeposits: [
      ...base.guestDeposits.map((d) =>
        d.id === DEMO_DEPOSIT_ID
          ? {
              ...d,
              status: "held" as const,
              notes:
                "Held at check-in · glass + remote + late checkout logged as cuts.",
            }
          : d,
      ),
      ...structuredClone(extraGuestDeposits),
      ...structuredClone(denseGuestDeposits),
    ],
    guestCharges: [
      ...base.guestCharges,
      ...structuredClone(extraGuestCharges),
      ...structuredClone(denseGuestCharges),
    ],
    stayPhotos: [...base.stayPhotos, ...structuredClone(extraStayPhotos)],
    stayDateRequests: [
      ...base.stayDateRequests,
      ...structuredClone(extraStayDateRequests),
    ],
  };
}

function slugifyName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "member"
  );
}

function uniqueShareSlug(base: string, profiles: Profile[]) {
  let slug = base;
  let i = 2;
  while (profiles.some((p) => p.share_slug === slug)) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

const STORE_KEY = "pulseflow_demo_store_v24";
const USER_KEY = "pulseflow_demo_user";

type Listener = () => void;

let memoryStore: DemoStore | null = null;
const listeners = new Set<Listener>();
let scheduleSynced = false;

/** Replace em/en dashes so cached demo copy stays clean. */
function plainDash(value: string | null | undefined) {
  if (value == null) return value as null | undefined;
  return value.replaceAll("-", "-").replaceAll("-", "-");
}

function repairDemoCompanyBilling(orgs: Organization[]): Organization[] {
  const freshTrial = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString();
  })();
  return orgs.map((org) => {
    if (org.kind !== "company") return org;
    return {
      ...org,
      subscription_status: "active",
      trial_ends_at:
        org.trial_ends_at && new Date(org.trial_ends_at) > new Date()
          ? org.trial_ends_at
          : freshTrial,
    };
  });
}

function normalizeStore(store: DemoStore): DemoStore {
  const fresh = createFreshDemoStore();
  const profileById = new Map(store.profiles.map((p) => [p.id, p]));
  for (const p of fresh.profiles) {
    if (!profileById.has(p.id)) profileById.set(p.id, p);
  }
  const accountByEmail = new Map(
    store.accounts.map((a) => [a.email.toLowerCase(), a]),
  );
  for (const a of fresh.accounts) {
    if (!accountByEmail.has(a.email.toLowerCase())) {
      accountByEmail.set(a.email.toLowerCase(), a);
    }
  }

  // Demo inventory always comes from the latest seed (photos, office, occupancy,
  // tasks, deposits, etc.). Keep only user-created rows that are not in seed.
  const seedVillaIds = new Set(fresh.villas.map((v) => v.id));
  const seedTaskIds = new Set(fresh.tasks.map((t) => t.id));
  const seedBillIds = new Set(fresh.bills.map((b) => b.id));
  const seedOrderIds = new Set(fresh.serviceOrders.map((o) => o.id));
  const seedMsgIds = new Set(fresh.messages.map((m) => m.id));
  const seedNotifIds = new Set(fresh.notifications.map((n) => n.id));
  const seedContactIds = new Set(fresh.contacts.map((c) => c.id));
  const seedStayIds = new Set(fresh.guestStays.map((s) => s.id));
  const seedAssignKeys = new Set(
    fresh.villaAssignments.map((a) => `${a.villa_id}:${a.profile_id}`),
  );

  return {
    ...fresh,
    orgs: repairDemoCompanyBilling(fresh.orgs),
    profiles: [...profileById.values()],
    accounts: [...accountByEmail.values()],
    endorsements: store.endorsements?.length
      ? store.endorsements
      : fresh.endorsements,
    memberships: store.memberships?.length
      ? store.memberships
      : fresh.memberships,
    invites: store.invites ?? [],
    villas: enrichDemoVillas(
      [
        ...fresh.villas,
        ...store.villas.filter((v) => !seedVillaIds.has(v.id)),
      ].map((v) =>
        normalizeVillaRow({
          ...v,
          photo_url: v.photo_url ?? null,
          description: plainDash(v.description) ?? null,
          notes: plainDash(v.notes) ?? null,
        }),
      ),
    ),
    tasks: [
      ...fresh.tasks,
      ...store.tasks.filter((t) => !seedTaskIds.has(t.id)),
    ].map((t) => ({
      ...t,
      title: plainDash(t.title) ?? t.title,
      time_start: t.time_start ?? null,
      time_end: t.time_end ?? null,
      service_order_id: t.service_order_id ?? null,
    })),
    bills: [
      ...fresh.bills,
      ...store.bills.filter((b) => !seedBillIds.has(b.id)),
    ].map((b) => ({
      ...b,
      due_date: b.due_date ?? null,
      category: b.category ?? "other",
    })),
    contacts: [
      ...fresh.contacts,
      ...store.contacts.filter((c) => !seedContactIds.has(c.id)),
    ].map((c) => ({
      ...c,
      linked_profile_id: c.linked_profile_id ?? null,
      notes: plainDash(c.notes) ?? null,
    })),
    messages: [
      ...fresh.messages,
      ...store.messages.filter((m) => !seedMsgIds.has(m.id)),
    ].map((m) => ({
      ...m,
      body: plainDash(m.body) ?? m.body,
      service_order_id: m.service_order_id ?? null,
      channel: m.channel ?? "general",
      attachment_url: m.attachment_url ?? null,
    })),
    notifications: [
      ...fresh.notifications,
      ...store.notifications.filter((n) => !seedNotifIds.has(n.id)),
    ].map((n) => ({
      ...n,
      title: plainDash(n.title) ?? n.title,
      body: plainDash(n.body) ?? n.body,
      read_by: Array.isArray(n.read_by) ? n.read_by : [],
    })),
    serviceOrders: [
      ...fresh.serviceOrders,
      ...store.serviceOrders.filter((o) => !seedOrderIds.has(o.id)),
    ].map((o) => ({
      ...o,
      service_type: plainDash(o.service_type) ?? o.service_type,
      details: plainDash(o.details) ?? null,
      location_label: plainDash(o.location_label) ?? null,
    })),
    villaAssignments: [
      ...fresh.villaAssignments,
      ...store.villaAssignments.filter(
        (a) => !seedAssignKeys.has(`${a.villa_id}:${a.profile_id}`),
      ),
    ],
    guestStays: [
      ...fresh.guestStays,
      ...(store.guestStays ?? []).filter((s) => !seedStayIds.has(s.id)),
    ],
    houseGuides: fresh.houseGuides,
    supportMessages: fresh.supportMessages,
    guestBriefings: fresh.guestBriefings,
    guestDeposits: fresh.guestDeposits,
    guestCharges: fresh.guestCharges,
    stayPhotos: fresh.stayPhotos,
    stayDateRequests: [
      ...fresh.stayDateRequests,
      ...(store.stayDateRequests ?? []).filter(
        (r) => !fresh.stayDateRequests.some((f) => f.id === r.id),
      ),
    ],
  };
}

function readStore(): DemoStore {
  if (typeof window === "undefined") {
    return createFreshDemoStore();
  }
  if (!memoryStore) {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      memoryStore = normalizeStore(JSON.parse(raw) as DemoStore);
      persist(memoryStore);
    } else {
      for (const key of [
        "pulseflow_demo_store_v1",
        "pulseflow_demo_store_v2",
        "pulseflow_demo_store_v3",
        "pulseflow_demo_store_v4",
        "pulseflow_demo_store_v5",
        "pulseflow_demo_store_v6",
        "pulseflow_demo_store_v7",
        "pulseflow_demo_store_v8",
        "pulseflow_demo_store_v9",
        "pulseflow_demo_store_v10",
        "pulseflow_demo_store_v11",
        "pulseflow_demo_store_v12",
        "pulseflow_demo_store_v13",
        "pulseflow_demo_store_v14",
        "pulseflow_demo_store_v15",
        "pulseflow_demo_store_v16",
        "pulseflow_demo_store_v17",
        "pulseflow_demo_store_v18",
        "pulseflow_demo_store_v19",
        "pulseflow_demo_store_v20",
        "pulseflow_demo_store_v21",
        "pulseflow_demo_store_v22",
        "pulseflow_demo_store_v23",
      ]) {
        localStorage.removeItem(key);
      }
      memoryStore = createFreshDemoStore();
      persist(memoryStore);
    }
  }
  return memoryStore;
}

function persist(store: DemoStore) {
  memoryStore = store;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }
  listeners.forEach((l) => l());
}

export function subscribeDemoStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDemoStore() {
  return readStore();
}

export function updateDemoStore(updater: (store: DemoStore) => DemoStore) {
  const next = updater(structuredClone(readStore()));
  persist(next);
  return next;
}

export function resetDemoStore() {
  persist(createFreshDemoStore());
}

function setSession(profileId: string) {
  document.cookie = `${USER_KEY}=${profileId}; path=/; max-age=2592000; SameSite=Lax`;
  localStorage.setItem(USER_KEY, profileId);
}

export function demoLogin(email: string, password: string): Profile | null {
  // Always load the latest screenshot-ready seed for demo seats.
  resetDemoStore();
  const store = readStore();
  const account = store.accounts.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password,
  );
  if (!account) return null;
  const profile = store.profiles.find((p) => p.id === account.profileId);
  if (!profile) return null;
  setSession(profile.id);
  return profile;
}

export function demoLogout() {
  document.cookie = `${USER_KEY}=; path=/; max-age=0; SameSite=Lax`;
  localStorage.removeItem(USER_KEY);
}

export function getDemoUserId(): string | null {
  if (typeof window === "undefined") return null;
  const fromStorage = localStorage.getItem(USER_KEY);
  if (fromStorage) return fromStorage;
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${USER_KEY}=`));
  return cookie ? cookie.split("=")[1] : null;
}

export function getDemoProfile(): Profile | null {
  const id = getDemoUserId();
  if (!id) return null;
  return readStore().profiles.find((p) => p.id === id) ?? null;
}

export function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function getInviteByToken(token: string): Invite | null {
  const invite = readStore().invites.find((i) => i.token === token);
  if (!invite || invite.used_at) return null;
  return invite;
}

export function getOrg(orgId: string): Organization | null {
  return readStore().orgs.find((o) => o.id === orgId) ?? null;
}

type RegisterOwnerInput = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  orgName: string;
  kind: OrgKind;
  /** Public register is always owner; managers/staff join via invite. */
  role?: "owner" | "manager";
};

export function demoRegisterWorkspace(input: RegisterOwnerInput): Profile {
  const email = input.email.trim().toLowerCase();
  const store = readStore();
  if (store.accounts.some((a) => a.email.toLowerCase() === email)) {
    throw new Error("An account with this email already exists. Sign in instead.");
  }

  const role = "owner" as const;
  const orgId = crypto.randomUUID();
  const profileId = crypto.randomUUID();
  const org: Organization = {
    id: orgId,
    name: input.orgName.trim(),
    kind: input.kind,
    created_at: new Date().toISOString(),
  };
  const share_slug = uniqueShareSlug(
    slugifyName(input.fullName),
    store.profiles,
  );
  const profile: Profile = {
    id: profileId,
    org_id: orgId,
    // Solo personal workspace is the org itself.
    personal_org_id: input.kind === "personal" ? orgId : null,
    role,
    full_name: input.fullName.trim(),
    phone: input.phone?.trim() || null,
    email,
    job_title: input.kind === "personal" ? "Personal" : "Owner",
    share_slug,
    job_search_visible: false,
    job_search_skills: [],
    job_search_bio: null,
    job_search_location: null,
    job_search_country: null,
    job_search_lat: null,
    job_search_lng: null,
    job_search_updated_at: null,
  };
  const account: DemoAccount = {
    email,
    password: input.password,
    profileId,
  };
  const membership: OrgMembership | null =
    input.kind === "company"
      ? {
          id: crypto.randomUUID(),
          org_id: orgId,
          profile_id: profileId,
          role,
          joined_at: new Date().toISOString(),
        }
      : null;

  updateDemoStore((s) => ({
    ...s,
    orgs: [...s.orgs, org],
    profiles: [...s.profiles, profile],
    accounts: [...s.accounts, account],
    memberships: membership
      ? [...s.memberships, membership]
      : s.memberships,
  }));
  setSession(profileId);
  return profile;
}

type CreateInviteInput = {
  role: Exclude<UserRole, "owner">;
  jobTitle?: string;
};

export function demoCreateInvite(
  actor: Profile,
  input: CreateInviteInput,
): Invite {
  const store = readStore();
  const org = store.orgs.find((o) => o.id === actor.org_id);
  if (!org || org.kind !== "company") {
    throw new Error("Invites are only available for company workspaces.");
  }
  const allowed =
    input.role === "guest"
      ? canInviteGuest(actor.role, org.kind)
        ? (["guest"] as const)
        : []
      : invitableStaffRoles(actor.role, org.kind);
  if (!(allowed as readonly string[]).includes(input.role)) {
    throw new Error("You cannot invite someone with that role.");
  }

  const invite: Invite = {
    id: crypto.randomUUID(),
    token: crypto.randomUUID().replace(/-/g, ""),
    org_id: actor.org_id,
    role: input.role,
    full_name: null,
    email: null,
    phone: null,
    job_title: input.jobTitle?.trim() || null,
    created_by: actor.id,
    created_at: new Date().toISOString(),
    used_at: null,
    used_by: null,
  };

  updateDemoStore((s) => ({ ...s, invites: [invite, ...s.invites] }));
  return invite;
}

export function demoDeleteInvite(actor: Profile, inviteId: string) {
  const store = readStore();
  const invite = store.invites.find((i) => i.id === inviteId);
  if (!invite || invite.org_id !== actor.org_id) {
    throw new Error("Invite not found.");
  }
  if (invite.used_at) {
    throw new Error("This invite was already used.");
  }
  updateDemoStore((s) => ({
    ...s,
    invites: s.invites.filter((i) => i.id !== inviteId),
  }));
}

export function getInviteContext(token: string) {
  const store = readStore();
  const invite = store.invites.find((i) => i.token === token && !i.used_at);
  if (!invite) return null;
  const org = store.orgs.find((o) => o.id === invite.org_id) ?? null;
  const inviter = store.profiles.find((p) => p.id === invite.created_by) ?? null;
  return { invite, org, inviter };
}

export function demoAcceptInvite(
  token: string,
  input: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  },
): Profile {
  const store = readStore();
  const invite = store.invites.find((i) => i.token === token && !i.used_at);
  if (!invite) throw new Error("This invite link is invalid or already used.");

  const email = input.email.trim().toLowerCase();
  const existingAccount = store.accounts.find(
    (a) => a.email.toLowerCase() === email,
  );

  // Existing user joining a company keeps their personal villas workspace.
  if (existingAccount) {
    const existing = store.profiles.find((p) => p.id === existingAccount.profileId);
    if (!existing) throw new Error("Account is missing a profile.");
    if (existingAccount.password !== input.password) {
      throw new Error("Wrong password for this email.");
    }

    const personalOrgId =
      existing.personal_org_id ??
      (existing.org_id !== invite.org_id ? existing.org_id : crypto.randomUUID());

    let personalOrg = store.orgs.find((o) => o.id === personalOrgId);
    const needsPersonalOrg = !personalOrg;

    updateDemoStore((s) => {
      const orgs = [...s.orgs];
      if (needsPersonalOrg) {
        orgs.push({
          id: personalOrgId,
          name: `${existing.full_name.split(" ")[0]}'s personal ops`,
          kind: "personal",
          created_at: new Date().toISOString(),
        });
      }
      const alreadyMember = s.memberships.some(
        (m) => m.profile_id === existing.id && m.org_id === invite.org_id,
      );
      const keepCurrentCompany = existing.org_id !== invite.org_id;
      const nextRole = pickPrimaryRole(existing.role, invite.role);
      const nextOrgId =
        existing.role === "guest" && invite.role !== "guest"
          ? invite.org_id
          : keepCurrentCompany
            ? existing.org_id
            : invite.org_id;
      const memberships = alreadyMember
        ? s.memberships
        : [
            ...s.memberships,
            {
              id: crypto.randomUUID(),
              org_id: invite.org_id,
              profile_id: existing.id,
              role: invite.role,
              joined_at: new Date().toISOString(),
            },
          ];
      const withHomeMembership =
        keepCurrentCompany &&
        !memberships.some(
          (m) => m.profile_id === existing.id && m.org_id === existing.org_id,
        )
          ? [
              ...memberships,
              {
                id: crypto.randomUUID(),
                org_id: existing.org_id,
                profile_id: existing.id,
                role: existing.role,
                joined_at: new Date().toISOString(),
              },
            ]
          : memberships;
      return {
        ...s,
        orgs,
        profiles: s.profiles.map((p) =>
          p.id === existing.id
            ? {
                ...p,
                org_id: nextOrgId,
                personal_org_id: personalOrgId,
                role: nextRole,
                job_title: invite.job_title ?? p.job_title,
                share_slug:
                  p.share_slug ||
                  uniqueShareSlug(slugifyName(p.full_name), s.profiles),
              }
            : p,
        ),
        memberships: withHomeMembership,
        invites: s.invites.map((i) =>
          i.id === invite.id
            ? {
                ...i,
                full_name: existing.full_name,
                email,
                phone: existing.phone,
                used_at: new Date().toISOString(),
                used_by: existing.id,
              }
            : i,
        ),
      };
    });
    void personalOrg;
    setSession(existing.id);
    return getDemoProfile()!;
  }

  // Brand-new invitee: give them a fresh personal workspace for future side villas.
  const profileId = crypto.randomUUID();
  const personalOrgId = crypto.randomUUID();
  const personalOrg: Organization = {
    id: personalOrgId,
    name: `${input.fullName.trim().split(" ")[0]}'s personal ops`,
    kind: "personal",
    created_at: new Date().toISOString(),
  };
  const share_slug = uniqueShareSlug(
    slugifyName(input.fullName),
    store.profiles,
  );
  const profile: Profile = {
    id: profileId,
    org_id: invite.org_id,
    personal_org_id: personalOrgId,
    role: invite.role,
    full_name: input.fullName.trim(),
    phone: input.phone?.trim() || null,
    email,
    job_title: invite.job_title,
    share_slug,
    job_search_visible: false,
    job_search_skills: [],
    job_search_bio: null,
    job_search_location: null,
    job_search_country: null,
    job_search_lat: null,
    job_search_lng: null,
    job_search_updated_at: null,
  };
  const account: DemoAccount = {
    email,
    password: input.password,
    profileId,
  };

  updateDemoStore((s) => ({
    ...s,
    orgs: [...s.orgs, personalOrg],
    profiles: [...s.profiles, profile],
    accounts: [...s.accounts, account],
    memberships: [
      ...s.memberships,
      {
        id: crypto.randomUUID(),
        org_id: invite.org_id,
        profile_id: profileId,
        role: invite.role,
        joined_at: new Date().toISOString(),
      },
    ],
    invites: s.invites.map((i) =>
      i.id === invite.id
        ? {
            ...i,
            full_name: profile.full_name,
            email,
            phone: profile.phone,
            used_at: new Date().toISOString(),
            used_by: profileId,
          }
        : i,
    ),
  }));
  setSession(profileId);
  return profile;
}

export function demoCastEndorsement(
  actor: Profile,
  toProfileId: string,
  stars: 1 | 2 | 3 | 4 | 5,
  note?: string,
): Endorsement {
  if (actor.role !== "owner" && actor.role !== "manager") {
    throw new Error("Only owners and managers can cast weekly endorsements.");
  }
  const store = readStore();
  const target = store.profiles.find((p) => p.id === toProfileId);
  if (!target || target.org_id !== actor.org_id || target.role === "owner") {
    throw new Error("Pick a teammate in your organization.");
  }
  const key = weekKey();
  const existing = store.endorsements.find(
    (e) =>
      e.org_id === actor.org_id &&
      e.from_profile_id === actor.id &&
      e.to_profile_id === toProfileId &&
      e.week_key === key,
  );
  if (existing) {
    throw new Error("You already endorsed this person this week.");
  }

  const endorsement: Endorsement = {
    id: crypto.randomUUID(),
    org_id: actor.org_id,
    from_profile_id: actor.id,
    to_profile_id: toProfileId,
    stars,
    week_key: key,
    note: note?.trim() || null,
    created_at: new Date().toISOString(),
  };

  updateDemoStore((s) => ({
    ...s,
    endorsements: [endorsement, ...s.endorsements],
  }));

  demoPushNotifications([
    buildEndorsementReceivedNotification({
      org_id: actor.org_id,
      fromProfileId: actor.id,
      fromName: actor.full_name,
      toProfileId,
      stars,
      note,
      weekKey: key,
    }),
  ]);

  return endorsement;
}

export function getPublicProfileBySlug(slug: string) {
  const store = readStore();
  const profile = store.profiles.find((p) => p.share_slug === slug);
  if (!profile || profile.role === "owner") return null;
  const publicProfile: Profile = {
    ...profile,
    email: "",
    phone: null,
  };
  return {
    profile: publicProfile,
    endorsements: store.endorsements.filter(
      (e) => e.to_profile_id === profile.id,
    ),
    memberships: store.memberships.filter((m) => m.profile_id === profile.id),
    orgs: store.orgs.map((o) => ({
      ...o,
      billing_email: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
    })),
    tasksDone: store.tasks.filter(
      (t) => t.assigned_to === profile.id && t.status === "done",
    ).length,
    tasksOpen: store.tasks.filter(
      (t) => t.assigned_to === profile.id && t.status === "open",
    ).length,
  };
}

export function demoPushNotifications(items: AppNotification[]) {
  if (!items.length) return;
  updateDemoStore((s) => ({
    ...s,
    notifications: [...items, ...(s.notifications ?? [])],
  }));
  if (typeof window !== "undefined") {
    void import("@/lib/push/client").then(({ dispatchPushForNotifications }) => {
      dispatchPushForNotifications(
        items.map((n) => ({
          org_id: n.org_id,
          kind: n.kind,
          title: n.title,
          body: n.body,
          href: n.href,
          entity_id: n.entity_id,
          audience_profile_ids: n.audience_profile_ids,
          dedupe_key: n.dedupe_key,
        })),
      );
    });
  }
}

export function demoMarkNotificationRead(profileId: string, id: string) {
  updateDemoStore((s) => ({
    ...s,
    notifications: (s.notifications ?? []).map((n) => {
      const readBy = n.read_by ?? [];
      return n.id === id && !readBy.includes(profileId)
        ? { ...n, read_by: [...readBy, profileId] }
        : { ...n, read_by: readBy };
    }),
  }));
}

export function demoMarkAllNotificationsRead(
  profileId: string,
  orgId: string,
  kind?: AppNotification["kind"],
) {
  updateDemoStore((s) => ({
    ...s,
    notifications: (s.notifications ?? []).map((n) => {
      const readBy = n.read_by ?? [];
      const visible =
        n.org_id === orgId && notificationVisibleTo(n, profileId);
      const kindOk =
        !kind ||
        n.kind === kind ||
        (kind === "message" && isChatBadgeNotification(n));
      return visible && kindOk && !readBy.includes(profileId)
        ? { ...n, read_by: [...readBy, profileId] }
        : { ...n, read_by: readBy };
    }),
  }));
}

/** Once per page-load: upcoming check-ins/outs + bill due windows + date-driven status. */
export function demoSyncScheduleAlerts() {
  if (typeof window === "undefined" || scheduleSynced) return;
  scheduleSynced = true;
  const store = readStore();
  const villaPatches = store.villas
    .map((v) => ({ id: v.id, patch: dateDrivenVillaPatch(v) }))
    .filter(
      (x): x is { id: string; patch: NonNullable<ReturnType<typeof dateDrivenVillaPatch>> } =>
        Boolean(x.patch),
    );

  const alerts = buildScheduleAlerts({
    villas: store.villas,
    bills: store.bills,
    orders: store.serviceOrders ?? [],
    existing: store.notifications ?? [],
    profiles: store.profiles,
    assignments: store.villaAssignments,
    endorsements: store.endorsements,
  });

  if (!villaPatches.length && !alerts.length) return;

  updateDemoStore((s) => ({
    ...s,
    villas: villaPatches.length
      ? s.villas.map((v) => {
          const hit = villaPatches.find((p) => p.id === v.id);
          return hit
            ? { ...v, ...hit.patch, updated_at: new Date().toISOString() }
            : v;
        })
      : s.villas,
    notifications: alerts.length
      ? [...alerts, ...(s.notifications ?? [])]
      : s.notifications,
  }));
}

export function demoCreateServiceOrder(
  actor: Profile,
  input: {
    contact_id: string;
    villa_id: string | null;
    location_label?: string | null;
    service_type: string;
    details?: string | null;
    scheduled_date: string;
    time_start?: string | null;
    time_end?: string | null;
    require_ack?: boolean;
  },
): ServiceOrder {
  const store = readStore();
  const contact = store.contacts.find(
    (c) => c.id === input.contact_id && c.org_id === actor.org_id,
  );
  if (!contact) throw new Error("Contact not found.");
  if (!contact.linked_profile_id) {
    throw new Error(
      "This contact is not on PulseFlow. Link a team member or call them.",
    );
  }
  const staffProfile = store.profiles.find(
    (p) => p.id === contact.linked_profile_id,
  );
  if (!staffProfile || !isTaskAssignableRole(staffProfile.role)) {
    throw new Error("Guests cannot be assigned jobs.");
  }
  const villa = input.villa_id
    ? store.villas.find((v) => v.id === input.villa_id)
    : null;
  const location =
    villa?.name ??
    input.location_label?.trim() ??
    "Location TBC";
  const serviceType = capitalizeLabel(input.service_type);
  const orderId = crypto.randomUUID();
  const taskId = crypto.randomUUID();
  const msgId = crypto.randomUUID();
  const when =
    formatWorkWindow(
      input.scheduled_date,
      input.time_start ?? null,
      input.time_end ?? null,
    ) ?? input.scheduled_date;
  const now = new Date().toISOString();

  const order: ServiceOrder = {
    id: orderId,
    org_id: actor.org_id,
    contact_id: contact.id,
    staff_profile_id: contact.linked_profile_id,
    ordered_by: actor.id,
    villa_id: villa?.id ?? null,
    location_label: location,
    service_type: serviceType,
    details: input.details?.trim() || null,
    scheduled_date: input.scheduled_date,
    time_start: input.time_start || null,
    time_end: input.time_end || null,
    status: "pending_ack",
    agreed_at: null,
    chat_message_id: msgId,
    task_id: taskId,
    created_at: now,
  };

  const chatBody = buildOrderChatBody({
    assigneeName: contact.name,
    serviceType: order.service_type,
    location,
    when,
    details: order.details,
    orderedBy: actor.full_name,
  });

  updateDemoStore((s) => {
    const nextTasks = [
      {
        id: taskId,
        org_id: actor.org_id,
        villa_id: order.villa_id,
        title: `${order.service_type} - ${location}`,
        priority: "normal" as const,
        assigned_to: contact.linked_profile_id,
        status: "open" as const,
        due_date: order.scheduled_date,
        time_start: order.time_start,
        time_end: order.time_end,
        created_by: actor.id,
        created_at: order.created_at,
        completed_at: null,
        service_order_id: orderId,
      },
      ...s.tasks,
    ];

    const nextMessages = [
      ...s.messages,
      {
        id: msgId,
        org_id: actor.org_id,
        sender_id: actor.id,
        body: chatBody,
        created_at: order.created_at,
        service_order_id: orderId,
        channel: "request" as const,
        attachment_url: null,
      },
    ];

    const nextNotifs: AppNotification[] = [
      makeNotification({
        org_id: actor.org_id,
        kind: "appointment",
        title: `New job: ${order.service_type}`,
        body: `${location} · ${when} - tap Read & agreed`,
        href: "/messages?channel=request",
        entity_id: orderId,
        audience_profile_ids: [contact.linked_profile_id!],
      }),
      ...(s.notifications ?? []),
    ];

    let nextAssignments = s.villaAssignments;
    if (
      order.villa_id &&
      contact.linked_profile_id &&
      staffProfile &&
      isStaffApp(staffProfile.role)
    ) {
      nextAssignments = ensureVillaAssignment(
        s,
        actor.org_id,
        order.villa_id,
        contact.linked_profile_id,
      );
    }

    return {
      ...s,
      serviceOrders: [order, ...(s.serviceOrders ?? [])],
      tasks: nextTasks,
      messages: nextMessages,
      notifications: nextNotifs,
      villaAssignments: nextAssignments,
    };
  });

  return order;
}

export function demoCompleteServiceOrder(actor: Profile, orderId: string) {
  const store = readStore();
  const order = store.serviceOrders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found.");
  if (
    order.staff_profile_id !== actor.id &&
    order.ordered_by !== actor.id &&
    actor.role !== "owner"
  ) {
    throw new Error("You cannot complete this order.");
  }
  const now = new Date().toISOString();
  const doneMsg = {
    id: crypto.randomUUID(),
    org_id: order.org_id,
    sender_id: actor.id,
    body: `✅ Done - ${order.service_type} at ${
      order.location_label ?? "location"
    } (${formatOrderWhen(order)})`,
    created_at: now,
    service_order_id: orderId,
    channel: "request" as const,
    attachment_url: null,
  };
  const audience = ownerManagerIds(store.profiles, order.org_id).filter(
    (id) => id !== actor.id,
  );

  updateDemoStore((s) => ({
    ...s,
    serviceOrders: s.serviceOrders.map((o) =>
      o.id === orderId ? { ...o, status: "done" as const } : o,
    ),
    tasks: s.tasks.map((t) =>
      t.id === order.task_id
        ? {
            ...t,
            status: "done" as const,
            completed_at: now,
          }
        : t,
    ),
    messages: [...s.messages, doneMsg],
    notifications: [
      ...(audience.length
        ? [
            makeNotification({
              org_id: order.org_id,
              kind: "appointment",
              title: `${actor.full_name} completed a job`,
              body: `${order.service_type} · ${
                order.location_label ?? "location"
              } · ${formatOrderWhen(order)}`,
              href: "/jobs",
              entity_id: orderId,
              audience_profile_ids: audience,
            }),
          ]
        : []),
      ...(s.notifications ?? []),
    ],
  }));
}

export function demoAgreeServiceOrder(actor: Profile, orderId: string) {
  const store = readStore();
  const order = store.serviceOrders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found.");
  if (!canAgreeServiceOrder(actor, order)) {
    throw new Error("You cannot agree to this job.");
  }
  if (order.status !== "pending_ack") {
    throw new Error("This job is already confirmed.");
  }
  const now = new Date().toISOString();
  const claimStaff = order.staff_profile_id ?? actor.id;
  const confirmMsg = {
    id: crypto.randomUUID(),
    org_id: order.org_id,
    sender_id: actor.id,
    body: `✅ Read and agreed - ${order.service_type} at ${
      order.location_label ?? "location"
    } (${formatOrderWhen(order)})`,
    created_at: now,
    service_order_id: orderId,
    channel: "request" as const,
    attachment_url: null,
  };

  updateDemoStore((s) => ({
    ...s,
    serviceOrders: s.serviceOrders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: "agreed" as const,
            agreed_at: now,
            staff_profile_id: claimStaff,
          }
        : o,
    ),
    tasks: s.tasks.map((t) =>
      t.id === order.task_id && !order.staff_profile_id
        ? { ...t, assigned_to: claimStaff }
        : t,
    ),
    messages: [...s.messages, confirmMsg],
    notifications: [
      ...(order.ordered_by && order.ordered_by !== actor.id
        ? [
            makeNotification({
              org_id: order.org_id,
              kind: "appointment",
              title: `${actor.full_name} agreed`,
              body: `${order.service_type} · ${formatOrderWhen(order)}`,
              href: "/jobs",
              entity_id: orderId,
              audience_profile_ids: [order.ordered_by],
            }),
          ]
        : []),
      ...(s.notifications ?? []).map((n) =>
        n.entity_id === orderId && n.kind === "appointment"
          ? {
              ...n,
              read_by: n.read_by.includes(actor.id)
                ? n.read_by
                : [...n.read_by, actor.id],
            }
          : n,
      ),
    ],
  }));
}

export function demoRevokeServiceOrderAgreement(actor: Profile, orderId: string) {
  const store = readStore();
  const order = store.serviceOrders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found.");
  if (!canRevokeServiceOrderAgreement(actor, order)) {
    throw new Error(
      "Cancel agreement is only available until 24 hours before the job. Use /cancel job in Team chat.",
    );
  }
  const now = new Date().toISOString();
  const when = formatOrderWhen(order);
  updateDemoStore((s) => ({
    ...s,
    serviceOrders: s.serviceOrders.map((o) =>
      o.id === orderId
        ? { ...o, status: "pending_ack" as const, agreed_at: null }
        : o,
    ),
    messages: [
      ...s.messages,
      {
        id: crypto.randomUUID(),
        org_id: order.org_id,
        sender_id: actor.id,
        body: `↩️ Agreement cancelled - ${order.service_type} at ${
          order.location_label ?? "location"
        } (${when})`,
        created_at: now,
        service_order_id: orderId,
        channel: "request" as const,
        attachment_url: null,
      },
    ],
  }));
}

export function demoCancelServiceOrder(
  actor: Profile,
  orderId: string,
  options?: { viaChatCommand?: boolean },
) {
  const store = readStore();
  const order = store.serviceOrders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found.");
  const org = store.orgs.find((o) => o.id === order.org_id);
  const viaChat = Boolean(options?.viaChatCommand);
  if (viaChat) {
    const allowed =
      canBookServices(actor.role, org?.kind ?? null) ||
      order.staff_profile_id === actor.id ||
      !order.staff_profile_id;
    if (!allowed) throw new Error("You cannot cancel this job.");
  } else if (!canCancelServiceOrder(actor, order, org?.kind ?? null)) {
    throw new Error(
      "Within 24 hours of the job, cancel in Team chat with /cancel job.",
    );
  }
  const declined =
    order.staff_profile_id === actor.id && order.status === "pending_ack";
  const now = new Date().toISOString();
  const chatMsg = {
    id: crypto.randomUUID(),
    org_id: order.org_id,
    sender_id: actor.id,
    body: declined
      ? `Declined - ${order.service_type} at ${
          order.location_label ?? "location"
        } (${formatOrderWhen(order)})`
      : `Cancelled - ${order.service_type} at ${
          order.location_label ?? "location"
        } (${formatOrderWhen(order)})`,
    created_at: now,
    service_order_id: orderId,
    channel: "request" as const,
    attachment_url: null,
  };
  const audience = declined
    ? [
        order.ordered_by,
        ...ownerManagerIds(store.profiles, order.org_id),
      ].filter((id) => id !== actor.id)
    : [order.staff_profile_id, order.ordered_by].filter(
        (id): id is string => Boolean(id) && id !== actor.id,
      );
  const uniqueAudience = [...new Set(audience)];

  updateDemoStore((s) => ({
    ...s,
    serviceOrders: s.serviceOrders.map((o) =>
      o.id === orderId ? { ...o, status: "cancelled" as const } : o,
    ),
    tasks: s.tasks.map((t) =>
      t.id === order.task_id
        ? {
            ...t,
            status: "done" as const,
            completed_at: now,
          }
        : t,
    ),
    messages: [...s.messages, chatMsg],
    notifications: [
      ...(uniqueAudience.length
        ? [
            makeNotification({
              org_id: order.org_id,
              kind: "appointment",
              title: declined ? "Job declined" : "Job cancelled",
              body: `${order.service_type} · ${
                order.location_label ?? "location"
              } · ${formatOrderWhen(order)}`,
              href: "/jobs",
              entity_id: orderId,
              audience_profile_ids: uniqueAudience,
            }),
          ]
        : []),
      ...(s.notifications ?? []).map((n) =>
        n.entity_id === orderId && n.kind === "appointment"
          ? {
              ...n,
              read_by: n.read_by.includes(actor.id)
                ? n.read_by
                : [...n.read_by, actor.id],
            }
          : n,
      ),
    ],
  }));
}

export function demoReopenServiceOrder(
  actor: Profile,
  orderId: string,
  options?: { assigned_to?: string | null },
) {
  const store = readStore();
  const order = store.serviceOrders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found.");
  const org = store.orgs.find((o) => o.id === order.org_id);
  if (!canReopenServiceOrder(actor, order, org?.kind ?? null)) {
    throw new Error("Only owners or managers can reassign this job.");
  }
  const assigneeId =
    options && "assigned_to" in options
      ? options.assigned_to ?? null
      : order.staff_profile_id;
  if (assigneeId) {
    const assignee = store.profiles.find((p) => p.id === assigneeId);
    if (!assignee || !isTaskAssignableRole(assignee.role)) {
      throw new Error("Guests cannot be assigned jobs.");
    }
  }
  const now = new Date().toISOString();
  const when = formatOrderWhen(order);
  const location = order.location_label ?? "General";
  const assigneeName = assigneeId
    ? store.profiles.find((p) => p.id === assigneeId)?.full_name ?? null
    : null;
  const msgId = crypto.randomUUID();
  const chatBody = buildOrderChatBody({
    assigneeName,
    serviceType: order.service_type,
    location,
    when,
    details: order.details,
    orderedBy: actor.full_name,
  });
  const audience = assigneeId
    ? [assigneeId]
    : ownerManagerIds(store.profiles, order.org_id).length
      ? store.profiles
          .filter(
            (p) =>
              p.org_id === order.org_id &&
              p.id !== actor.id &&
              isTaskAssignableRole(p.role),
          )
          .map((p) => p.id)
      : [];

  updateDemoStore((s) => ({
    ...s,
    serviceOrders: s.serviceOrders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: "pending_ack" as const,
            agreed_at: null,
            staff_profile_id: assigneeId,
            chat_message_id: msgId,
          }
        : o,
    ),
    tasks: s.tasks.map((t) =>
      t.id === order.task_id
        ? {
            ...t,
            assigned_to: assigneeId,
            status: "open" as const,
            completed_at: null,
          }
        : t,
    ),
    messages: [
      ...s.messages,
      {
        id: msgId,
        org_id: order.org_id,
        sender_id: actor.id,
        body: chatBody,
        created_at: now,
        service_order_id: orderId,
        channel: "request" as const,
        attachment_url: null,
      },
    ],
    notifications: [
      makeNotification({
        org_id: order.org_id,
        kind: "appointment",
        title: assigneeId ? "Job reassigned" : "Open job posted",
        body: `${order.service_type} · ${location} · tap Read & agreed`,
        href: "/messages?channel=request",
        entity_id: orderId,
        audience_profile_ids: audience.length ? audience : null,
      }),
      ...(s.notifications ?? []),
    ],
  }));
}

export function ensurePersonalOrg(profile: Profile): string {
  if (profile.personal_org_id) return profile.personal_org_id;
  const store = readStore();
  const orgId = crypto.randomUUID();
  const org: Organization = {
    id: orgId,
    name: `${profile.full_name.split(" ")[0]}'s personal ops`,
    kind: "personal",
    created_at: new Date().toISOString(),
  };
  updateDemoStore((s) => ({
    ...s,
    orgs: [...s.orgs, org],
    profiles: s.profiles.map((p) =>
      p.id === profile.id ? { ...p, personal_org_id: orgId } : p,
    ),
  }));
  return orgId;
}

/** Move a personal villa into the user's current company org. */
export function demoMergeVillaToCompany(actor: Profile, villaId: string) {
  const store = readStore();
  const villa = store.villas.find((v) => v.id === villaId);
  if (!villa) throw new Error("Property not found.");
  if (!actor.personal_org_id || villa.org_id !== actor.personal_org_id) {
    throw new Error("Only personal (no-company) properties can be merged.");
  }
  const company = store.orgs.find((o) => o.id === actor.org_id);
  if (!company || company.kind !== "company") {
    throw new Error(
      "Join a registered company first (owner invites you), then merge.",
    );
  }
  if (actor.org_id === actor.personal_org_id) {
    throw new Error("You're still on a personal workspace only.");
  }

  updateDemoStore((s) => ({
    ...s,
    villas: s.villas.map((v) =>
      v.id === villaId
        ? { ...v, org_id: actor.org_id, updated_at: new Date().toISOString() }
        : v,
    ),
  }));
}

export function demoSetVillaAssignments(
  actor: Profile,
  managerId: string,
  villaIds: string[],
) {
  if (actor.role !== "owner") {
    throw new Error("Only owners can assign properties to managers.");
  }
  const store = readStore();
  const manager = store.profiles.find(
    (p) => p.id === managerId && p.org_id === actor.org_id,
  );
  if (!manager || manager.role === "owner") {
    throw new Error("Pick a team member in your organization.");
  }

  const kept = store.villaAssignments.filter(
    (a) => !(a.org_id === actor.org_id && a.profile_id === managerId),
  );
  const next: VillaAssignment[] = villaIds.map((villaId) => ({
    id: crypto.randomUUID(),
    org_id: actor.org_id,
    villa_id: villaId,
    profile_id: managerId,
  }));

  updateDemoStore((s) => ({
    ...s,
    villaAssignments: [...kept, ...next],
  }));
}

/** Owner assigns people TO a single villa (from villa detail). */
export function demoSetVillaAssignees(
  actor: Profile,
  villaId: string,
  profileIds: string[],
) {
  if (actor.role !== "owner") {
    throw new Error("Only owners can set property assignees.");
  }
  const store = readStore();
  const villa = store.villas.find(
    (v) => v.id === villaId && v.org_id === actor.org_id,
  );
  if (!villa) throw new Error("Property not found.");

  const kept = store.villaAssignments.filter(
    (a) => !(a.org_id === actor.org_id && a.villa_id === villaId),
  );
  const next: VillaAssignment[] = profileIds
    .filter((id) => {
      const p = store.profiles.find((x) => x.id === id);
      return p && p.org_id === actor.org_id && p.role !== "owner";
    })
    .map((profileId) => ({
      id: crypto.randomUUID(),
      org_id: actor.org_id,
      villa_id: villaId,
      profile_id: profileId,
    }));

  updateDemoStore((s) => ({
    ...s,
    villaAssignments: [...kept, ...next],
  }));
}

export function companyVillasFor(
  profile: Profile,
  villas: Villa[],
  assignments: VillaAssignment[],
  orgId = profile.org_id,
  role: Profile["role"] = profile.role,
): Villa[] {
  const orgVillas = villas.filter((v) => v.org_id === orgId);
  // Owners, managers, and stay guests share the full company inventory
  // (guests browse the catalog; staff stay assignment-scoped).
  if (role === "owner" || role === "manager" || role === "guest") {
    return orgVillas;
  }

  // Cleaner / staff: only company villas assigned to them (not full inventory).
  // Personal side properties live in personal_org via personalVillasFor / buildVillaList.
  const assignedIds = new Set(
    assignments
      .filter((a) => a.profile_id === profile.id)
      .map((a) => a.villa_id),
  );
  return orgVillas.filter((v) => assignedIds.has(v.id));
}

/** Ensure staff get property access when booked on a company villa. */
export function ensureVillaAssignment(
  store: DemoStore,
  orgId: string,
  villaId: string,
  profileId: string,
): VillaAssignment[] {
  const exists = store.villaAssignments.some(
    (a) =>
      a.org_id === orgId &&
      a.villa_id === villaId &&
      a.profile_id === profileId,
  );
  if (exists) return store.villaAssignments;
  return [
    ...store.villaAssignments,
    {
      id: crypto.randomUUID(),
      org_id: orgId,
      villa_id: villaId,
      profile_id: profileId,
    },
  ];
}

export function personalVillasFor(profile: Profile, villas: Villa[]): Villa[] {
  if (!profile.personal_org_id) return [];
  return villas.filter(
    (v) =>
      v.org_id === profile.personal_org_id && v.created_by === profile.id,
  );
}

export function buildVillaList(
  profile: Profile,
  villas: Villa[],
  assignments: VillaAssignment[],
  orgs: Organization[],
  memberships: OrgMembership[] = [],
): VillaListItem[] {
  if (profile.role === "guest") {
    const guestOrgIds = new Set(
      memberships
        .filter((m) => m.profile_id === profile.id && m.role === "guest")
        .map((m) => m.org_id),
    );
    const activeOrg = orgs.find((o) => o.id === profile.org_id);
    if (activeOrg?.kind === "company") guestOrgIds.add(profile.org_id);

    return villas
      .filter((v) => guestOrgIds.has(v.org_id))
      .map((v) => ({
        ...v,
        bucket: "company" as const,
        orgLabel: orgs.find((o) => o.id === v.org_id)?.name ?? "Company",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const personalOrg = profile.personal_org_id
    ? orgs.find((o) => o.id === profile.personal_org_id)
    : null;
  const companyOrgIds = new Set(
    memberships
      .filter((m) => m.profile_id === profile.id)
      .map((m) => m.org_id),
  );
  const activeOrg = orgs.find((o) => o.id === profile.org_id);
  if (activeOrg?.kind === "company") companyOrgIds.add(profile.org_id);
  if (profile.personal_org_id) companyOrgIds.delete(profile.personal_org_id);

  const isSoloPersonal =
    activeOrg?.kind === "personal" &&
    profile.personal_org_id === profile.org_id;

  const company = isSoloPersonal
    ? []
    : [...companyOrgIds].flatMap((orgId) => {
        const role =
          memberships.find(
            (m) => m.profile_id === profile.id && m.org_id === orgId,
          )?.role ?? (orgId === profile.org_id ? profile.role : "staff");
        const orgName = orgs.find((o) => o.id === orgId)?.name ?? "Company";
        return companyVillasFor(profile, villas, assignments, orgId, role).map(
          (v) => ({
            ...v,
            bucket: "company" as const,
            orgLabel: orgName,
          }),
        );
      });

  const personalSource = isSoloPersonal
    ? villas.filter((v) => v.org_id === profile.org_id)
    : personalVillasFor(profile, villas).filter(
        (v) => !company.some((c) => c.id === v.id),
      );

  const personal = personalSource.map((v) => ({
    ...v,
    bucket: "personal" as const,
    orgLabel: personalOrg?.kind === "personal" || isSoloPersonal
      ? "No company"
      : personalOrg?.name ?? "No company",
  }));

  return [...company, ...personal];
}

/** @deprecated prefer buildVillaList */
export function villasVisibleTo(
  profile: Profile,
  villas: Villa[],
  assignments: VillaAssignment[],
): Villa[] {
  return buildVillaList(profile, villas, assignments, []).map(
    ({ bucket: _b, orgLabel: _o, ...v }) => v,
  );
}
