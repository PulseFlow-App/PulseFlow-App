"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { isDemoMode } from "@/lib/supabase/client";
import { useSupabaseData } from "@/lib/data/use-supabase-data";
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
import {
  loadLocallyReadIds,
  mergeReadBy,
  rememberLocallyRead,
} from "@/lib/notifications-read";
import { formatMoney, formatShortDate } from "@/lib/utils";

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
      if (!profile || !canBookServices(profile.role, org?.kind)) {
        throw new Error("Only company owners or managers can book services.");
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
    uploadReceipt: async (file) => URL.createObjectURL(file),
    uploadVillaPhoto: async (file) => {
      const { fileToDataUrl } = await import("@/lib/file-to-data-url");
      return fileToDataUrl(file);
    },
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

export function useData(): AppData {
  const demo = isDemoMode();
  const demoData = useDemoData();
  const supabaseData = useSupabaseData(!demo);
  return demo ? demoData : supabaseData;
}
