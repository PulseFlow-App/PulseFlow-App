"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { isDemoMode } from "@/lib/supabase/client";
import { assertDemoWritable } from "@/lib/demo/guard";
import { useSupabaseData } from "@/lib/data/use-supabase-data";
import {
  buildVillaList,
  demoAgreeServiceOrder,
  demoCancelServiceOrder,
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
  canViewAllBills,
  personalVillasOnly,
} from "@/lib/roles";
import {
  makeNotification,
  notificationVisibleTo,
  orgMemberIds,
  ownerManagerIds,
  buildVillaDateNotifications,
  villaOpsAudience,
  unreadNotifications,
} from "@/lib/notifications";
import {
  loadLocallyReadIds,
  mergeReadBy,
  rememberLocallyRead,
} from "@/lib/notifications-read";
import { formatMoney, formatShortDate } from "@/lib/utils";
import { normalizeBillCurrency } from "@/lib/billing/currencies";
import { capitalizeLabel } from "@/lib/format-label";

export type { AppData } from "@/lib/data/types";
import type { AppData } from "@/lib/data/types";

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
        category: b.category ?? "other",
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
  const [localReadIds, setLocalReadIds] = useState<string[]>([]);
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

  useEffect(() => {
    if (!profile?.id) {
      setLocalReadIds([]);
      return;
    }
    setLocalReadIds(loadLocallyReadIds(profile.id));
  }, [profile?.id]);

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
      if (canViewAllBills(profile.role)) return true;
      return b.submitted_by === profile.id;
    });
  }, [store.bills, profile]);

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
      .map((n) => ({
        ...n,
        read_by: mergeReadBy(n.read_by, profile.id, localReadIds, n.id),
      }))
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [store.notifications, profile, localReadIds]);

  const unreadNotificationCount = useMemo(() => {
    if (!profile) return 0;
    return unreadNotifications(
      notifications,
      profile.id,
      profile.org_id,
    ).length;
  }, [notifications, profile]);

  const unreadMessageCount = useMemo(() => {
    if (!profile) return 0;
    return unreadNotifications(
      notifications,
      profile.id,
      profile.org_id,
    ).filter((n) => n.kind === "message").length;
  }, [notifications, profile]);

  const villaAssignments = useMemo(() => {
    if (!profile) return [];
    return store.villaAssignments.filter((a) => a.org_id === profile.org_id);
  }, [store.villaAssignments, profile]);

  const serviceOrders = useMemo(() => {
    if (!profile) return [];
    return (store.serviceOrders ?? []).filter((o) => o.org_id === profile.org_id);
  }, [store.serviceOrders, profile]);

  const guestStays = useMemo(() => {
    if (!profile) return [];
    const all = store.guestStays ?? [];
    if (profile.role === "guest") {
      return all.filter((s) => s.guest_profile_id === profile.id);
    }
    if (profile.role === "owner" || profile.role === "manager") {
      return all.filter((s) => s.org_id === profile.org_id);
    }
    return [];
  }, [store.guestStays, profile]);

  const activeStay = useMemo(() => {
    if (!profile || profile.role !== "guest") return null;
    return (
      guestStays.find((s) => s.status === "active") ??
      guestStays.find((s) => s.status === "upcoming") ??
      guestStays[0] ??
      null
    );
  }, [guestStays, profile]);

  const houseGuides = useMemo(() => {
    if (!profile) return [];
    return (store.houseGuides ?? []).filter((g) => g.org_id === profile.org_id);
  }, [store.houseGuides, profile]);

  const supportMessages = useMemo(() => {
    if (!profile) return [];
    const stayIds = new Set(guestStays.map((s) => s.id));
    return [...(store.supportMessages ?? [])]
      .filter((m) => stayIds.has(m.stay_id))
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
      .map((m) => ({
        ...m,
        sender: orgProfiles.find((p) => p.id === m.sender_id) ?? null,
      }));
  }, [store.supportMessages, guestStays, orgProfiles, profile]);

  const guestDeposits = useMemo(() => {
    if (!profile) return [];
    const stayIds = new Set(guestStays.map((s) => s.id));
    return (store.guestDeposits ?? []).filter((d) => stayIds.has(d.stay_id));
  }, [store.guestDeposits, guestStays, profile]);

  const guestCharges = useMemo(() => {
    if (!profile) return [];
    const stayIds = new Set(guestStays.map((s) => s.id));
    return (store.guestCharges ?? []).filter((c) => stayIds.has(c.stay_id));
  }, [store.guestCharges, guestStays, profile]);

  const stayPhotos = useMemo(() => {
    if (!profile) return [];
    const stayIds = new Set(guestStays.map((s) => s.id));
    return (store.stayPhotos ?? []).filter((p) => stayIds.has(p.stay_id));
  }, [store.stayPhotos, guestStays, profile]);

  const stayDateRequests = useMemo(() => {
    if (!profile) return [];
    if (profile.role === "guest") {
      return (store.stayDateRequests ?? []).filter(
        (r) => r.guest_profile_id === profile.id,
      );
    }
    if (profile.role === "owner" || profile.role === "manager") {
      return (store.stayDateRequests ?? []).filter(
        (r) => r.org_id === profile.org_id,
      );
    }
    return [];
  }, [store.stayDateRequests, profile]);

  return {
    ready: hydrated,
    profile,
    organization: org,
    companyEntitled: true,
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
    villaAssignments,
    memberships: store.memberships ?? [],
    endorsements: store.endorsements ?? [],
    notifications,
    serviceOrders,
    unreadNotificationCount,
    unreadMessageCount,
    guestStays,
    activeStay,
    houseGuides,
    supportMessages,
    guestDeposits,
    guestCharges,
    stayPhotos,
    stayDateRequests,
    refresh: async () => undefined,
    markNotificationRead: async (id) => {
      if (!profile) return;
      rememberLocallyRead(profile.id, [id]);
      setLocalReadIds((prev) => [...new Set([...prev, id])]);
      demoMarkNotificationRead(profile.id, id);
    },
    markAllNotificationsRead: async (kind) => {
      if (!profile) return;
      const ids = notifications
        .filter(
          (n) =>
            !(n.read_by ?? []).includes(profile.id) &&
            (!kind || n.kind === kind),
        )
        .map((n) => n.id);
      if (ids.length) {
        rememberLocallyRead(profile.id, ids);
        setLocalReadIds((prev) => [...new Set([...prev, ...ids])]);
      }
      demoMarkAllNotificationsRead(profile.id, profile.org_id, kind);
    },
    createServiceOrder: async (input) => {
      assertDemoWritable();
      if (!profile || !canBookServices(profile.role, org?.kind)) {
        throw new Error("Only company owners or managers can book services.");
      }
      return demoCreateServiceOrder(profile, input);
    },
    agreeServiceOrder: async (orderId) => {
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      demoAgreeServiceOrder(profile, orderId);
    },
    cancelServiceOrder: async (orderId) => {
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      demoCancelServiceOrder(profile, orderId);
    },
    completeServiceOrder: async (orderId) => {
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      demoCompleteServiceOrder(profile, orderId);
    },
    updateVilla: async (id, patch) => {
      assertDemoWritable();
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
      const alerts = buildVillaDateNotifications({
        org_id: before.org_id,
        villaId: before.id,
        villaName: before.name,
        before: { check_in: before.check_in, check_out: before.check_out },
        patch,
        audience_profile_ids: villaOpsAudience(
          before.org_id,
          before.id,
          store.profiles,
          store.villaAssignments,
        ),
      });
      demoPushNotifications(alerts);
    },
    createVilla: async (input) => {
      assertDemoWritable();
      if (!profile || !canCreateVillas(profile.role)) {
        throw new Error("You cannot add villas.");
      }
      let scope =
        input.scope ??
        (profile.role === "owner" && org?.kind === "company"
          ? "company"
          : "personal");
      if (personalVillasOnly(profile.role, org?.kind)) scope = "personal";

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
      assertDemoWritable();
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
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      demoMergeVillaToCompany(profile, villaId);
    },
    updateOrganizationName: async (name) => {
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      if (profile.role !== "owner") {
        throw new Error("Only the owner can rename the company.");
      }
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Company name is required.");
      updateDemoStore((s) => ({
        ...s,
        orgs: s.orgs.map((o) =>
          o.id === profile.org_id ? { ...o, name: trimmed } : o,
        ),
      }));
    },
    createTask: async (input) => {
      assertDemoWritable();
      if (!profile) return;
      const taskId = uid("task");
      const title = capitalizeLabel(input.title);
      updateDemoStore((s) => ({
        ...s,
        tasks: [
          {
            id: taskId,
            org_id: profile.org_id,
            title,
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
            body: title,
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
            body: title,
            href: "/tasks",
            entity_id: taskId,
            audience_profile_ids: [input.assigned_to],
          }),
        );
      }
      demoPushNotifications(alerts);
    },
    setTaskStatus: async (id, status) => {
      assertDemoWritable();
      const task = store.tasks.find((t) => t.id === id);
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
      if (
        task &&
        status === "done" &&
        profile &&
        task.assigned_to === profile.id &&
        task.created_by !== profile.id
      ) {
        demoPushNotifications([
          makeNotification({
            org_id: task.org_id,
            kind: "task_completed",
            title: "Task completed",
            body: task.title,
            href: "/tasks",
            entity_id: task.id,
            audience_profile_ids: [task.created_by],
          }),
        ]);
      }
    },
    createContact: async (input) => {
      assertDemoWritable();
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
      assertDemoWritable();
      updateDemoStore((s) => ({
        ...s,
        contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },
    deleteContact: async (id) => {
      assertDemoWritable();
      updateDemoStore((s) => ({
        ...s,
        contacts: s.contacts.filter((c) => c.id !== id),
      }));
    },
    createBill: async (input) => {
      assertDemoWritable();
      if (!profile) return;
      const billId = uid("bill");
      const due_date = input.due_date?.trim() || null;
      const currency = normalizeBillCurrency(input.currency);
      updateDemoStore((s) => ({
        ...s,
        bills: [
          {
            id: billId,
            org_id: profile.org_id,
            description: input.description,
            amount: input.amount,
            villa_id: input.villa_id,
            currency,
            status: "pending",
            category: input.category ?? "other",
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
          body: `${input.description} · ${formatMoney(input.amount, currency)}`,
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
            body: `${input.description} · ${formatMoney(input.amount, currency)}`,
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
      assertDemoWritable();
      if (!profile || !canMarkBillsPaid(profile.role)) {
        throw new Error("Only owners or managers can mark bills paid.");
      }
      const bill = store.bills.find((b) => b.id === id);
      updateDemoStore((s) => ({
        ...s,
        bills: s.bills.map((b) => (b.id === id ? { ...b, status } : b)),
      }));
      if (
        bill &&
        status === "paid" &&
        bill.submitted_by !== profile.id
      ) {
        demoPushNotifications([
          makeNotification({
            org_id: bill.org_id,
            kind: "bill_paid",
            title: "Bill marked paid",
            body: `${bill.description} · ${formatMoney(Number(bill.amount), bill.currency)}`,
            href: "/bills",
            entity_id: bill.id,
            audience_profile_ids: [bill.submitted_by],
          }),
        ]);
      }
    },
    sendMessage: async (body) => {
      assertDemoWritable();
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
      const { mentionedProfileIds, hasEveryoneMention } = await import(
        "@/lib/mentions"
      );
      const orgProfiles = store.profiles.filter(
        (p) => p.org_id === profile.org_id,
      );
      const mentioned = mentionedProfileIds(body, orgProfiles).filter(
        (id) => id !== profile.id,
      );
      const others = orgMemberIds(store.profiles, profile.org_id).filter(
        (id) => id !== profile.id,
      );
      const alerts: ReturnType<typeof makeNotification>[] = [];
      const preview = body.trim().slice(0, 80);
      const first = profile.full_name.split(" ")[0];
      if (mentioned.length) {
        alerts.push(
          makeNotification({
            org_id: profile.org_id,
            kind: "message",
            title: hasEveryoneMention(body)
              ? `${first} mentioned @everyone`
              : `${first} mentioned you`,
            body: preview,
            href: "/messages",
            entity_id: msgId,
            audience_profile_ids: mentioned,
          }),
        );
      }
      const rest = others.filter((id) => !mentioned.includes(id));
      if (rest.length) {
        alerts.push(
          makeNotification({
            org_id: profile.org_id,
            kind: "message",
            title: `New message from ${first}`,
            body: preview,
            href: "/messages",
            entity_id: msgId,
            audience_profile_ids: rest,
          }),
        );
      }
      if (alerts.length) demoPushNotifications(alerts);
    },
    uploadReceipt: async (file) => {
      assertDemoWritable();
      return URL.createObjectURL(file);
    },
    uploadVillaPhoto: async (file) => {
      assertDemoWritable();
      const { fileToDataUrl } = await import("@/lib/file-to-data-url");
      return fileToDataUrl(file);
    },
    createInvite: async (input) => {
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      return demoCreateInvite(profile, input);
    },
    setVillaAssignments: async (managerId, villaIds) => {
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      demoSetVillaAssignments(profile, managerId, villaIds);
    },
    setVillaAssignees: async (villaId, profileIds) => {
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      demoSetVillaAssignees(profile, villaId, profileIds);
    },
    castEndorsement: async (toProfileId, stars, note) => {
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      demoCastEndorsement(profile, toProfileId, stars, note);
    },
    sendSupportMessage: async (body, stayId) => {
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      const stay =
        (stayId
          ? guestStays.find((s) => s.id === stayId)
          : null) ??
        activeStay ??
        (profile.role === "owner" || profile.role === "manager"
          ? guestStays[0]
          : null);
      if (!stay) throw new Error("No stay for support chat.");
      const canReply =
        profile.id === stay.guest_profile_id ||
        profile.role === "owner" ||
        profile.role === "manager";
      if (!canReply) throw new Error("Only guest or host can use support chat.");
      const text = body.trim();
      if (!text) return;
      updateDemoStore((s) => ({
        ...s,
        supportMessages: [
          ...s.supportMessages,
          {
            id: uid("support"),
            org_id: stay.org_id,
            stay_id: stay.id,
            sender_id: profile.id,
            body: text,
            created_at: new Date().toISOString(),
          },
        ],
      }));
      const recipients =
        profile.id === stay.guest_profile_id
          ? ownerManagerIds(store.profiles, stay.org_id)
          : [stay.guest_profile_id];
      demoPushNotifications([
        makeNotification({
          org_id: stay.org_id,
          kind: "message",
          title: "Support message",
          body: text.slice(0, 120),
          href: "/messages",
          entity_id: stay.id,
          audience_profile_ids: recipients,
        }),
      ]);
    },
    upsertHouseGuide: async (villaId, patch) => {
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      if (profile.role !== "owner" && profile.role !== "manager") {
        throw new Error("Only owners or managers can edit the house guide.");
      }
      updateDemoStore((s) => {
        const existing = s.houseGuides.find((g) => g.villa_id === villaId);
        const now = new Date().toISOString();
        if (existing) {
          return {
            ...s,
            houseGuides: s.houseGuides.map((g) =>
              g.villa_id === villaId ? { ...g, ...patch, updated_at: now } : g,
            ),
          };
        }
        return {
          ...s,
          houseGuides: [
            ...s.houseGuides,
            {
              id: uid("guide"),
              org_id: profile.org_id,
              villa_id: villaId,
              wifi_ssid: null,
              wifi_password: null,
              gate_code: null,
              bins_notes: null,
              quiet_hours: null,
              checkout_checklist: null,
              extra_notes: null,
              ...patch,
              updated_at: now,
            },
          ],
        };
      });
    },
    requestStayDates: async (input) => {
      assertDemoWritable();
      if (!profile || profile.role !== "guest") {
        throw new Error("Only guests can request dates.");
      }
      updateDemoStore((s) => ({
        ...s,
        stayDateRequests: [
          ...s.stayDateRequests,
          {
            id: uid("dates"),
            org_id: profile.org_id,
            villa_id: input.villa_id,
            guest_profile_id: profile.id,
            check_in: input.check_in,
            check_out: input.check_out,
            note: input.note?.trim() || null,
            status: "pending",
            created_at: new Date().toISOString(),
          },
        ],
      }));
      demoPushNotifications([
        makeNotification({
          org_id: profile.org_id,
          kind: "appointment",
          title: "Date request",
          body: `${profile.full_name} requested stay dates`,
          href: "/villas",
          entity_id: input.villa_id,
          audience_profile_ids: ownerManagerIds(store.profiles, profile.org_id),
        }),
      ]);
    },
    addStayPhoto: async (input) => {
      assertDemoWritable();
      if (!profile) throw new Error("Not signed in.");
      if (!activeStay) throw new Error("No active stay.");
      updateDemoStore((s) => ({
        ...s,
        stayPhotos: [
          ...s.stayPhotos,
          {
            id: uid("photo"),
            org_id: activeStay.org_id,
            stay_id: activeStay.id,
            kind: input.kind,
            photo_url: input.photo_url,
            note: input.note?.trim() || null,
            uploaded_by: profile.id,
            created_at: new Date().toISOString(),
          },
        ],
      }));
    },
  };
}

export function useData(): AppData {
  const demo = isDemoMode();
  const demoData = useDemoData();
  const supabaseData = useSupabaseData(!demo);
  return demo ? demoData : supabaseData;
}
