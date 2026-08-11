"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { isDemoMode, createClient } from "@/lib/supabase/client";
import {
  buildVillaList,
  demoAgreeServiceOrder,
  demoCompleteServiceOrder,
  demoCastEndorsement,
  demoCreateInvite,
  demoCreateServiceOrder,
  demoMarkAllNotificationsRead,
  demoMarkNotificationRead,
  demoMergeVillaToCompany,
  demoPushNotifications,
  demoSetVillaAssignments,
  demoSetVillaAssignees,
  demoSyncScheduleAlerts,
  ensurePersonalOrg,
  getDemoProfile,
  getDemoStore,
  subscribeDemoStore,
  updateDemoStore,
  uid,
} from "@/lib/demo/store";
import type {
  AppNotification,
  Bill,
  BillWithRelations,
  Contact,
  Endorsement,
  Invite,
  MessageWithSender,
  OrgMembership,
  Organization,
  Profile,
  ServiceOrder,
  Task,
  TaskWithRelations,
  Villa,
  VillaAssignment,
  VillaListItem,
} from "@/lib/types";
import type { BillStatus, TaskPriority, TaskStatus, UserRole } from "@/lib/design-tokens";
import {
  canBookServices,
  canCreateVillas,
  canMarkBillsPaid,
  personalVillasOnly,
} from "@/lib/roles";
import {
  makeNotification,
  notificationVisibleTo,
  orgMemberIds,
  ownerManagerIds,
  unreadNotifications,
} from "@/lib/notifications";
import { formatMoney, formatShortDate } from "@/lib/utils";

export type AppData = {
  ready: boolean;
  profile: Profile | null;
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
  refresh: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
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
    villa_id: string | null;
    due_date?: string | null;
    receipt_photo_url?: string | null;
  }) => Promise<void>;
  setBillStatus: (id: string, status: BillStatus) => Promise<void>;
  sendMessage: (body: string) => Promise<void>;
  uploadReceipt: (file: File) => Promise<string | null>;
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
};

function enrichTasks(
  tasks: Task[],
  villas: Villa[],
  profiles: Profile[],
): TaskWithRelations[] {
  return tasks
    .map((t) => {
      const villa = villas.find((v) => v.id === t.villa_id);
      const assignee = profiles.find((p) => p.id === t.assigned_to);
      return {
        ...t,
        villa: villa ? { id: villa.id, name: villa.name } : null,
        assignee: assignee
          ? { id: assignee.id, full_name: assignee.full_name }
          : null,
      };
    })
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

function enrichBills(
  bills: Bill[],
  villas: Villa[],
  profiles: Profile[],
): BillWithRelations[] {
  return bills
    .map((b) => {
      const villa = villas.find((v) => v.id === b.villa_id);
      const submitter = profiles.find((p) => p.id === b.submitted_by);
      return {
        ...b,
        villa: villa ? { id: villa.id, name: villa.name } : null,
        submitter: submitter
          ? { id: submitter.id, full_name: submitter.full_name }
          : null,
      };
    })
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

function useDemoData(): AppData {
  // Avoid SSR/client mismatch: demo profile + localStorage only exist in the browser.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
    demoSyncScheduleAlerts();
  }, []);

  const store = useSyncExternalStore(
    subscribeDemoStore,
    getDemoStore,
    getDemoStore,
  );
  const profile = hydrated ? getDemoProfile() : null;
  const org = profile
    ? store.orgs.find((o) => o.id === profile.org_id) ?? null
    : null;

  const orgProfiles = useMemo(
    () =>
      profile
        ? store.profiles.filter((p) => p.org_id === profile.org_id)
        : [],
    [store.profiles, profile],
  );

  const allOrgVillas = useMemo(
    () =>
      profile
        ? store.villas.filter((v) => v.org_id === profile.org_id)
        : [],
    [store.villas, profile],
  );

  const villaList = useMemo(() => {
    if (!profile) return [];
    return buildVillaList(
      profile,
      store.villas,
      store.villaAssignments,
      store.orgs,
    );
  }, [profile, store.villas, store.villaAssignments, store.orgs]);

  const visibleVillas = useMemo(
    () => villaList.map(({ bucket: _b, orgLabel: _o, ...v }) => v as Villa),
    [villaList],
  );

  const visibleIds = useMemo(
    () => new Set(visibleVillas.map((v) => v.id)),
    [visibleVillas],
  );

  const orgTasks = useMemo(() => {
    if (!profile) return [];
    return store.tasks.filter((t) => {
      if (t.org_id !== profile.org_id) return false;
      if (profile.role === "owner") return true;
      if (!t.villa_id) return true;
      return visibleIds.has(t.villa_id);
    });
  }, [store.tasks, profile, visibleIds]);

  const orgBills = useMemo(() => {
    if (!profile) return [];
    return store.bills.filter((b) => {
      if (b.org_id !== profile.org_id) return false;
      if (profile.role === "owner") return true;
      if (!b.villa_id) return true;
      return visibleIds.has(b.villa_id);
    });
  }, [store.bills, profile, visibleIds]);

  const tasks = useMemo(
    () => enrichTasks(orgTasks, visibleVillas, orgProfiles),
    [orgTasks, visibleVillas, orgProfiles],
  );
  const bills = useMemo(
    () => enrichBills(orgBills, visibleVillas, orgProfiles),
    [orgBills, visibleVillas, orgProfiles],
  );
  const messages = useMemo(() => {
    if (!profile) return [];
    return [...store.messages]
      .filter((m) => m.org_id === profile.org_id)
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
      .map((m) => ({
        ...m,
        sender: orgProfiles.find((p) => p.id === m.sender_id) ?? null,
      }));
  }, [store.messages, profile, orgProfiles]);

  const invites = useMemo(() => {
    if (!profile) return [];
    return store.invites.filter((i) => i.org_id === profile.org_id && !i.used_at);
  }, [store.invites, profile]);

  const contacts = useMemo(() => {
    if (!profile) return [];
    return store.contacts.filter((c) => c.org_id === profile.org_id);
  }, [store.contacts, profile]);

  const notifications = useMemo(() => {
    if (!profile) return [];
    return [...(store.notifications ?? [])]
      .filter(
        (n) =>
          n.org_id === profile.org_id &&
          notificationVisibleTo(n, profile.id),
      )
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [store.notifications, profile]);

  const unreadNotificationCount = useMemo(() => {
    if (!profile) return 0;
    return unreadNotifications(
      store.notifications ?? [],
      profile.id,
      profile.org_id,
    ).length;
  }, [store.notifications, profile]);

  const unreadMessageCount = useMemo(() => {
    if (!profile) return 0;
    return unreadNotifications(
      store.notifications ?? [],
      profile.id,
      profile.org_id,
    ).filter((n) => n.kind === "message").length;
  }, [store.notifications, profile]);

  return {
    ready: hydrated,
    profile,
    orgName: org?.name ?? "",
    orgKind: org?.kind ?? null,
    profiles: orgProfiles,
    allProfiles: store.profiles,
    orgs: store.orgs,
    villas: visibleVillas,
    villaList,
    allOrgVillas,
    contacts,
    tasks,
    bills,
    messages,
    invites,
    villaAssignments: store.villaAssignments.filter(
      (a) => a.org_id === profile?.org_id,
    ),
    memberships: store.memberships ?? [],
    endorsements: store.endorsements ?? [],
    notifications,
    serviceOrders: (store.serviceOrders ?? []).filter(
      (o) => o.org_id === profile?.org_id,
    ),
    unreadNotificationCount,
    unreadMessageCount,
    refresh: async () => undefined,
    markNotificationRead: async (id) => {
      if (!profile) return;
      demoMarkNotificationRead(profile.id, id);
    },
    markAllNotificationsRead: async () => {
      if (!profile) return;
      demoMarkAllNotificationsRead(profile.id, profile.org_id);
    },
    createServiceOrder: async (input) => {
      if (!profile || !canBookServices(profile.role)) {
        throw new Error("Only owners or managers can book services.");
      }
      return demoCreateServiceOrder(profile, input);
    },
    agreeServiceOrder: async (orderId) => {
      if (!profile) throw new Error("Not signed in.");
      demoAgreeServiceOrder(profile, orderId);
    },
    completeServiceOrder: async (orderId) => {
      if (!profile) throw new Error("Not signed in.");
      demoCompleteServiceOrder(profile, orderId);
    },
    updateVilla: async (id, patch) => {
      const before = store.villas.find((v) => v.id === id);
      updateDemoStore((s) => ({
        ...s,
        villas: s.villas.map((v) =>
          v.id === id
            ? { ...v, ...patch, updated_at: new Date().toISOString() }
            : v,
        ),
      }));
      if (!before || !profile) return;
      const alerts: AppNotification[] = [];
      if (
        patch.check_in !== undefined &&
        patch.check_in &&
        patch.check_in !== before.check_in
      ) {
        alerts.push(
          makeNotification({
            org_id: before.org_id,
            kind: "check_in",
            title: "Check-in updated",
            body: `${before.name} · ${formatShortDate(patch.check_in)}`,
            href: `/villas/${before.id}`,
            entity_id: before.id,
            dedupe_key: `check_in_set:${before.id}:${patch.check_in}`,
          }),
        );
      }
      if (
        patch.check_out !== undefined &&
        patch.check_out &&
        patch.check_out !== before.check_out
      ) {
        alerts.push(
          makeNotification({
            org_id: before.org_id,
            kind: "check_out",
            title: "Check-out updated",
            body: `${before.name} · ${formatShortDate(patch.check_out)}`,
            href: `/villas/${before.id}`,
            entity_id: before.id,
            dedupe_key: `check_out_set:${before.id}:${patch.check_out}`,
          }),
        );
      }
      demoPushNotifications(alerts);
    },
    createVilla: async (input) => {
      if (!profile || !canCreateVillas(profile.role)) {
        throw new Error("You cannot add villas.");
      }
      let scope =
        input.scope ??
        (profile.role === "owner" && org?.kind === "company"
          ? "company"
          : "personal");
      if (personalVillasOnly(profile.role)) scope = "personal";

      let orgId = profile.org_id;
      if (scope === "personal") {
        orgId = ensurePersonalOrg(getDemoProfile() ?? profile);
      }

      updateDemoStore((s) => ({
        ...s,
        villas: [
          {
            id: crypto.randomUUID(),
            org_id: orgId,
            name: input.name,
            area: input.area ?? null,
            location_url: input.location_url.trim(),
            description: input.description?.trim() || null,
            photo_url: input.photo_url ?? null,
            status: input.status ?? "available",
            check_in: null,
            check_out: null,
            cleaning_status: "not_needed",
            notes: null,
            created_by: profile.id,
            updated_at: new Date().toISOString(),
          },
          ...s.villas,
        ],
      }));
    },
    deleteVilla: async (id) => {
      if (!profile) return;
      const villa = store.villas.find((v) => v.id === id);
      if (!villa) return;
      const isPersonal =
        profile.personal_org_id && villa.org_id === profile.personal_org_id;
      if (profile.role !== "owner" && !isPersonal) {
        throw new Error("You can only remove your personal villas.");
      }
      if (profile.role === "owner" && villa.org_id !== profile.org_id) {
        throw new Error("Only company villas can be removed by the owner.");
      }
      updateDemoStore((s) => ({
        ...s,
        villas: s.villas.filter((v) => v.id !== id),
        villaAssignments: s.villaAssignments.filter((a) => a.villa_id !== id),
      }));
    },
    mergeVillaToCompany: async (villaId) => {
      if (!profile) throw new Error("Not signed in.");
      demoMergeVillaToCompany(profile, villaId);
    },
    createTask: async (input) => {
      if (!profile) return;
      const taskId = uid("task");
      updateDemoStore((s) => ({
        ...s,
        tasks: [
          {
            id: taskId,
            org_id: profile.org_id,
            title: input.title,
            villa_id: input.villa_id,
            priority: input.priority,
            assigned_to: input.assigned_to,
            due_date: input.due_date,
            time_start: input.time_start ?? null,
            time_end: input.time_end ?? null,
            status: "open",
            created_by: profile.id,
            created_at: new Date().toISOString(),
            completed_at: null,
            service_order_id: null,
          },
          ...s.tasks,
        ],
      }));
      const alerts: AppNotification[] = [];
      if (input.priority === "urgent") {
        const audience = input.assigned_to
          ? [input.assigned_to]
          : orgMemberIds(store.profiles, profile.org_id).filter(
              (id) => id !== profile.id,
            );
        alerts.push(
          makeNotification({
            org_id: profile.org_id,
            kind: "urgent_task",
            title: "Urgent task",
            body: input.title,
            href: "/tasks",
            entity_id: taskId,
            audience_profile_ids: audience.length ? audience : null,
          }),
        );
      } else if (input.assigned_to && input.assigned_to !== profile.id) {
        alerts.push(
          makeNotification({
            org_id: profile.org_id,
            kind: "task_assigned",
            title: "Task assigned to you",
            body: input.title,
            href: "/tasks",
            entity_id: taskId,
            audience_profile_ids: [input.assigned_to],
          }),
        );
      }
      demoPushNotifications(alerts);
    },
    setTaskStatus: async (id, status) => {
      updateDemoStore((s) => ({
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                completed_at:
                  status === "done" ? new Date().toISOString() : null,
              }
            : t,
        ),
      }));
    },
    createContact: async (input) => {
      if (!profile) return;
      updateDemoStore((s) => ({
        ...s,
        contacts: [
          { id: uid("contact"), org_id: profile.org_id, ...input },
          ...s.contacts,
        ],
      }));
    },
    updateContact: async (id, patch) => {
      updateDemoStore((s) => ({
        ...s,
        contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },
    deleteContact: async (id) => {
      updateDemoStore((s) => ({
        ...s,
        contacts: s.contacts.filter((c) => c.id !== id),
      }));
    },
    createBill: async (input) => {
      if (!profile) return;
      const billId = uid("bill");
      const due_date = input.due_date?.trim() || null;
      updateDemoStore((s) => ({
        ...s,
        bills: [
          {
            id: billId,
            org_id: profile.org_id,
            description: input.description,
            amount: input.amount,
            villa_id: input.villa_id,
            currency: "THB",
            status: "pending",
            due_date,
            submitted_by: profile.id,
            receipt_photo_url: input.receipt_photo_url ?? null,
            created_at: new Date().toISOString(),
          },
          ...s.bills,
        ],
      }));
      const managers = ownerManagerIds(store.profiles, profile.org_id).filter(
        (id) => id !== profile.id,
      );
      const alerts: AppNotification[] = [
        makeNotification({
          org_id: profile.org_id,
          kind: "bill_submitted",
          title: "Bill submitted",
          body: `${input.description} · ${formatMoney(input.amount)}`,
          href: "/bills",
          entity_id: billId,
          audience_profile_ids: managers.length ? managers : null,
        }),
      ];
      if (due_date) {
        alerts.push(
          makeNotification({
            org_id: profile.org_id,
            kind: "bill_due",
            title: `Bill due ${formatShortDate(due_date)}`,
            body: `${input.description} · ${formatMoney(input.amount)}`,
            href: "/bills",
            entity_id: billId,
            audience_profile_ids: managers.length
              ? [...new Set([...managers, profile.id])]
              : null,
            dedupe_key: `bill_due_created:${billId}:${due_date}`,
          }),
        );
      }
      demoPushNotifications(alerts);
    },
    setBillStatus: async (id, status) => {
      if (!profile || !canMarkBillsPaid(profile.role)) {
        throw new Error("Only owners or managers can mark bills paid.");
      }
      updateDemoStore((s) => ({
        ...s,
        bills: s.bills.map((b) => (b.id === id ? { ...b, status } : b)),
      }));
    },
    sendMessage: async (body) => {
      if (!profile) return;
      const msgId = uid("msg");
      updateDemoStore((s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: msgId,
            org_id: profile.org_id,
            sender_id: profile.id,
            body,
            created_at: new Date().toISOString(),
            service_order_id: null,
          },
        ],
      }));
      const others = orgMemberIds(store.profiles, profile.org_id).filter(
        (id) => id !== profile.id,
      );
      if (others.length) {
        const preview = body.trim().slice(0, 80);
        demoPushNotifications([
          makeNotification({
            org_id: profile.org_id,
            kind: "message",
            title: `New message from ${profile.full_name.split(" ")[0]}`,
            body: preview,
            href: "/messages",
            entity_id: msgId,
            audience_profile_ids: others,
          }),
        ]);
      }
    },
    uploadReceipt: async (file) => URL.createObjectURL(file),
    createInvite: async (input) => {
      if (!profile) throw new Error("Not signed in.");
      return demoCreateInvite(profile, input);
    },
    setVillaAssignments: async (managerId, villaIds) => {
      if (!profile) throw new Error("Not signed in.");
      demoSetVillaAssignments(profile, managerId, villaIds);
    },
    setVillaAssignees: async (villaId, profileIds) => {
      if (!profile) throw new Error("Not signed in.");
      demoSetVillaAssignees(profile, villaId, profileIds);
    },
    castEndorsement: async (toProfileId, stars, note) => {
      if (!profile) throw new Error("Not signed in.");
      demoCastEndorsement(profile, toProfileId, stars, note);
    },
  };
}

function useSupabaseData(enabled: boolean): AppData {
  const empty: AppData = {
    ready: !enabled,
    profile: null,
    orgName: "",
    orgKind: null,
    profiles: [],
    allProfiles: [],
    orgs: [],
    villas: [],
    villaList: [],
    allOrgVillas: [],
    contacts: [],
    tasks: [],
    bills: [],
    messages: [],
    invites: [],
    villaAssignments: [],
    memberships: [],
    endorsements: [],
    notifications: [],
    serviceOrders: [],
    unreadNotificationCount: 0,
    unreadMessageCount: 0,
    refresh: async () => undefined,
    markNotificationRead: async () => undefined,
    markAllNotificationsRead: async () => undefined,
    createServiceOrder: async () => {
      throw new Error("Connect Supabase to book services.");
    },
    agreeServiceOrder: async () => undefined,
    completeServiceOrder: async () => undefined,
    updateVilla: async () => undefined,
    createVilla: async () => undefined,
    deleteVilla: async () => undefined,
    mergeVillaToCompany: async () => undefined,
    createTask: async () => undefined,
    setTaskStatus: async () => undefined,
    createContact: async () => undefined,
    updateContact: async () => undefined,
    deleteContact: async () => undefined,
    createBill: async () => undefined,
    setBillStatus: async () => undefined,
    sendMessage: async () => undefined,
    uploadReceipt: async () => null,
    createInvite: async () => {
      throw new Error("Connect Supabase to create invites.");
    },
    setVillaAssignments: async () => undefined,
    setVillaAssignees: async () => undefined,
    castEndorsement: async () => undefined,
  };

  const [ready, setReady] = useState(!enabled);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgKind, setOrgKind] = useState<"personal" | "company" | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [villas, setVillas] = useState<Villa[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [villaAssignments, setVillaAssignments] = useState<VillaAssignment[]>(
    [],
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setReady(true);
      return;
    }
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!profileRow) {
      setReady(true);
      return;
    }
    setProfile(profileRow as Profile);
    const orgId = profileRow.org_id as string;
    const [
      orgRes,
      profilesRes,
      villasRes,
      contactsRes,
      tasksRes,
      billsRes,
      messagesRes,
      invitesRes,
      assignRes,
    ] = await Promise.all([
      supabase.from("organizations").select("name, kind").eq("id", orgId).single(),
      supabase.from("profiles").select("*").eq("org_id", orgId),
      supabase.from("villas").select("*").eq("org_id", orgId).order("name"),
      supabase.from("contacts").select("*").eq("org_id", orgId).order("role"),
      supabase
        .from("tasks")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("bills")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(id, full_name, role)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: true }),
      supabase
        .from("invites")
        .select("*")
        .eq("org_id", orgId)
        .is("used_at", null),
      supabase.from("villa_assignments").select("*").eq("org_id", orgId),
    ]);
    setOrgName(orgRes.data?.name ?? "");
    setOrgKind((orgRes.data?.kind as "personal" | "company") ?? null);
    setProfiles((profilesRes.data as Profile[]) ?? []);
    setVillas((villasRes.data as Villa[]) ?? []);
    setContacts((contactsRes.data as Contact[]) ?? []);
    setTasks((tasksRes.data as Task[]) ?? []);
    setBills((billsRes.data as Bill[]) ?? []);
    setMessages((messagesRes.data as MessageWithSender[]) ?? []);
    setInvites((invitesRes.data as Invite[]) ?? []);
    setVillaAssignments((assignRes.data as VillaAssignment[]) ?? []);
    setReady(true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  if (!enabled) return empty;

  const villaList = profile
    ? buildVillaList(profile, villas, villaAssignments, [
        {
          id: profile.org_id,
          name: orgName,
          kind: orgKind ?? "company",
          created_at: "",
        },
      ])
    : [];
  const visible = villaList.map(
    ({ bucket: _b, orgLabel: _o, ...v }) => v as Villa,
  );

  return {
    ready,
    profile,
    orgName,
    orgKind,
    profiles,
    allProfiles: profiles,
    orgs: [],
    villas: visible,
    villaList,
    allOrgVillas: villas,
    contacts,
    tasks: enrichTasks(tasks, visible, profiles),
    bills: enrichBills(bills, visible, profiles),
    messages,
    invites,
    villaAssignments,
    refresh,
    updateVilla: async (id, patch) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("villas")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await refresh();
    },
    createVilla: async (input) => {
      if (!profile) return;
      const supabase = createClient();
      const { error } = await supabase.from("villas").insert({
        org_id: profile.org_id,
        name: input.name,
        area: input.area ?? null,
        location_url: input.location_url.trim(),
        description: input.description?.trim() || null,
        photo_url: input.photo_url ?? null,
        status: input.status ?? "available",
        created_by: profile.id,
      });
      if (error) throw error;
      await refresh();
    },
    deleteVilla: async (id) => {
      const supabase = createClient();
      const { error } = await supabase.from("villas").delete().eq("id", id);
      if (error) throw error;
      await refresh();
    },
    mergeVillaToCompany: async (villaId) => {
      if (!profile) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("villas")
        .update({ org_id: profile.org_id })
        .eq("id", villaId);
      if (error) throw error;
      await refresh();
    },
    createTask: async (input) => {
      if (!profile) return;
      const supabase = createClient();
      const { error } = await supabase.from("tasks").insert({
        org_id: profile.org_id,
        created_by: profile.id,
        status: "open",
        ...input,
      });
      if (error) throw error;
      await refresh();
    },
    setTaskStatus: async (id, status) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("tasks")
        .update({
          status,
          completed_at: status === "done" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
      await refresh();
    },
    createContact: async (input) => {
      if (!profile) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("contacts")
        .insert({ org_id: profile.org_id, ...input });
      if (error) throw error;
      await refresh();
    },
    updateContact: async (id, patch) => {
      const supabase = createClient();
      const { error } = await supabase.from("contacts").update(patch).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    deleteContact: async (id) => {
      const supabase = createClient();
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
      await refresh();
    },
    createBill: async (input) => {
      if (!profile) return;
      const supabase = createClient();
      const { error } = await supabase.from("bills").insert({
        org_id: profile.org_id,
        submitted_by: profile.id,
        currency: "THB",
        status: "pending",
        ...input,
      });
      if (error) throw error;
      await refresh();
    },
    setBillStatus: async (id, status) => {
      const supabase = createClient();
      const { error } = await supabase.from("bills").update({ status }).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    sendMessage: async (body) => {
      if (!profile) return;
      const supabase = createClient();
      const { error } = await supabase.from("messages").insert({
        org_id: profile.org_id,
        sender_id: profile.id,
        body,
      });
      if (error) throw error;
      await refresh();
    },
    uploadReceipt: async (file) => {
      if (!profile) return null;
      const supabase = createClient();
      const path = `${profile.org_id}/${profile.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      return data.publicUrl;
    },
    createInvite: async (input) => {
      if (!profile) throw new Error("Not signed in.");
      const supabase = createClient();
      const token = crypto.randomUUID().replace(/-/g, "");
      const { data, error } = await supabase
        .from("invites")
        .insert({
          token,
          org_id: profile.org_id,
          role: input.role,
          full_name: null,
          email: null,
          phone: null,
          job_title: input.jobTitle ?? null,
          created_by: profile.id,
        })
        .select("*")
        .single();
      if (error) throw error;
      await refresh();
      return data as Invite;
    },
    setVillaAssignments: async (managerId, villaIds) => {
      if (!profile) return;
      const supabase = createClient();
      await supabase
        .from("villa_assignments")
        .delete()
        .eq("org_id", profile.org_id)
        .eq("profile_id", managerId);
      if (villaIds.length) {
        const { error } = await supabase.from("villa_assignments").insert(
          villaIds.map((villa_id) => ({
            org_id: profile.org_id,
            villa_id,
            profile_id: managerId,
          })),
        );
        if (error) throw error;
      }
      await refresh();
    },
    setVillaAssignees: async (villaId, profileIds) => {
      if (!profile) return;
      const supabase = createClient();
      await supabase
        .from("villa_assignments")
        .delete()
        .eq("org_id", profile.org_id)
        .eq("villa_id", villaId);
      if (profileIds.length) {
        const { error } = await supabase.from("villa_assignments").insert(
          profileIds.map((profile_id) => ({
            org_id: profile.org_id,
            villa_id: villaId,
            profile_id,
          })),
        );
        if (error) throw error;
      }
      await refresh();
    },
    memberships: [],
    endorsements: [],
    notifications: [],
    serviceOrders: [],
    unreadNotificationCount: 0,
    unreadMessageCount: 0,
    markNotificationRead: async () => undefined,
    markAllNotificationsRead: async () => undefined,
    createServiceOrder: async () => {
      throw new Error("Connect Supabase to book services.");
    },
    agreeServiceOrder: async () => undefined,
    completeServiceOrder: async () => undefined,
    castEndorsement: async () => {
      throw new Error("Connect Supabase to cast endorsements.");
    },
  };
}

export function useData(): AppData {
  const demo = isDemoMode();
  const demoData = useDemoData();
  const supabaseData = useSupabaseData(!demo);
  return demo ? demoData : supabaseData;
}
