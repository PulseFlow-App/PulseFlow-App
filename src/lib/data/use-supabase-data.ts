"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildVillaList } from "@/lib/demo/store";
import type { AppData } from "@/lib/data/types";
import type {
  AppNotification,
  Bill,
  Contact,
  Endorsement,
  Invite,
  MessageWithSender,
  OrgMembership,
  Organization,
  Profile,
  ServiceOrder,
  StayDateRequest,
  Task,
  Villa,
  VillaAssignment,
} from "@/lib/types";
import {
  canBookServices,
  canCreateVillas,
  canInviteGuest,
  canViewAllBills,
  invitableStaffRoles,
  isStaffApp,
  personalVillasOnly,
} from "@/lib/roles";
import {
  ENTITLEMENT_BLOCKED_MESSAGE,
  isCompanyEntitled,
} from "@/lib/billing/entitlement";
import { weekKey } from "@/lib/endorsements";
import {
  buildScheduleAlerts,
  buildBillCreateNotifications,
  buildEndorsementReceivedNotification,
  buildTaskCreateNotifications,
  buildVillaDateNotifications,
  insertNotifications,
  makeNotification,
  notificationVisibleTo,
  orgMemberIds,
  ownerManagerIds,
  toInsertRow,
  unreadNotifications,
  villaOpsAudience,
  type NotificationInsert,
} from "@/lib/notifications";
import { formatMoney } from "@/lib/utils";
import { normalizeBillCurrency } from "@/lib/billing/currencies";
import { formatOrderWhen, canCancelServiceOrder } from "@/lib/service-orders";
import {
  loadLocallyReadIds,
  mergeReadBy,
  rememberLocallyRead,
} from "@/lib/notifications-read";
import { capitalizeLabel } from "@/lib/format-label";

const scheduleSyncedOrgs = new Set<string>();

function normalizeProfile(row: Profile): Profile {
  return {
    ...row,
    job_search_visible: Boolean(row.job_search_visible),
    job_search_skills: Array.isArray(row.job_search_skills)
      ? row.job_search_skills
      : [],
    job_search_bio: row.job_search_bio ?? null,
    job_search_location: row.job_search_location ?? null,
    job_search_country: row.job_search_country ?? null,
    job_search_lat:
      row.job_search_lat == null || !Number.isFinite(Number(row.job_search_lat))
        ? null
        : Number(row.job_search_lat),
    job_search_lng:
      row.job_search_lng == null || !Number.isFinite(Number(row.job_search_lng))
        ? null
        : Number(row.job_search_lng),
    job_search_updated_at: row.job_search_updated_at ?? null,
  };
}

function enrichTasks(
  tasks: Task[],
  villas: Villa[],
  profiles: Profile[],
): AppData["tasks"] {
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
): AppData["bills"] {
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

async function ensurePersonalOrgId(profile: Profile): Promise<string> {
  if (profile.personal_org_id) return profile.personal_org_id;
  const res = await fetch("/api/org/ensure-personal", { method: "POST" });
  const payload = (await res.json()) as {
    personalOrgId?: string;
    error?: string;
  };
  if (!res.ok || !payload.personalOrgId) {
    throw new Error(payload.error ?? "Could not create personal workspace.");
  }
  return payload.personalOrgId;
}

export function useSupabaseData(enabled: boolean): AppData {
  const empty: AppData = {
    ready: !enabled,
    profile: null,
    organization: null,
    companyEntitled: true,
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
    guestStays: [],
    activeStay: null,
    houseGuides: [],
    supportMessages: [],
    guestDeposits: [],
    guestCharges: [],
    stayPhotos: [],
    stayDateRequests: [],
    refresh: async () => undefined,
    markNotificationRead: async () => undefined,
    markAllNotificationsRead: async () => undefined,
    createServiceOrder: async () => {
      throw new Error("Connect Supabase to book services.");
    },
    agreeServiceOrder: async () => undefined,
    cancelServiceOrder: async () => undefined,
    completeServiceOrder: async () => undefined,
    updateVilla: async () => undefined,
    createVilla: async () => undefined,
    deleteVilla: async () => undefined,
    mergeVillaToCompany: async () => undefined,
    updateOrganizationName: async () => undefined,
    createTask: async () => undefined,
    setTaskStatus: async () => undefined,
    createContact: async () => undefined,
    updateContact: async () => undefined,
    deleteContact: async () => undefined,
    createBill: async () => undefined,
    setBillStatus: async () => undefined,
    sendMessage: async () => undefined,
    uploadReceipt: async () => null,
    uploadVillaPhoto: async () => null,
    createInvite: async () => {
      throw new Error("Connect Supabase to create invites.");
    },
    setVillaAssignments: async () => undefined,
    setVillaAssignees: async () => undefined,
    castEndorsement: async () => undefined,
    sendSupportMessage: async () => undefined,
    upsertHouseGuide: async () => undefined,
    requestStayDates: async () => undefined,
    addStayPhoto: async () => undefined,
  };

  const [ready, setReady] = useState(!enabled);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [villas, setVillas] = useState<Villa[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [villaAssignments, setVillaAssignments] = useState<VillaAssignment[]>(
    [],
  );
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [stayDateRequests, setStayDateRequests] = useState<StayDateRequest[]>(
    [],
  );
  const [localReadIds, setLocalReadIds] = useState<string[]>([]);

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
    const p = normalizeProfile(profileRow as Profile);
    setProfile(p);
    const orgId = p.org_id;
    const personalId = p.personal_org_id;
    const orgIds = [orgId, personalId].filter(Boolean) as string[];

    const [
      orgRes,
      orgsRes,
      profilesRes,
      allProfilesRes,
      villasRes,
      contactsRes,
      tasksRes,
      billsRes,
      messagesRes,
      invitesRes,
      assignRes,
      membershipsRes,
      endorsementsRes,
      notificationsRes,
      ordersRes,
      dateRequestsRes,
    ] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", orgId).single(),
      supabase.from("organizations").select("*").in("id", orgIds),
      supabase.from("profiles").select("*").eq("org_id", orgId),
      supabase.from("profiles").select("*"),
      supabase.from("villas").select("*").in("org_id", orgIds).order("name"),
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
      supabase.from("invites").select("*").eq("org_id", orgId).is("used_at", null),
      supabase.from("villa_assignments").select("*").eq("org_id", orgId),
      supabase.from("org_memberships").select("*").eq("profile_id", p.id),
      supabase.from("endorsements").select("*").eq("org_id", orgId),
      supabase
        .from("notifications")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("service_orders")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("stay_date_requests")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false }),
    ]);

    setOrganization((orgRes.data as Organization) ?? null);
    setOrgs((orgsRes.data as Organization[]) ?? []);
    setProfiles((profilesRes.data as Profile[]) ?? []);
    setAllProfiles((allProfilesRes.data as Profile[]) ?? []);
    setVillas((villasRes.data as Villa[]) ?? []);
    setContacts((contactsRes.data as Contact[]) ?? []);
    setTasks((tasksRes.data as Task[]) ?? []);
    setBills((billsRes.data as Bill[]) ?? []);
    setMessages((messagesRes.data as MessageWithSender[]) ?? []);
    setInvites((invitesRes.data as Invite[]) ?? []);
    setVillaAssignments((assignRes.data as VillaAssignment[]) ?? []);
    setMemberships((membershipsRes.data as OrgMembership[]) ?? []);
    setEndorsements((endorsementsRes.data as Endorsement[]) ?? []);
    setNotifications(
      ((notificationsRes.data as AppNotification[]) ?? []).map((n) => ({
        ...n,
        read_by: Array.isArray(n.read_by) ? n.read_by : [],
      })),
    );
    setServiceOrders((ordersRes.data as ServiceOrder[]) ?? []);
    setStayDateRequests(
      dateRequestsRes.error
        ? []
        : ((dateRequestsRes.data as StayDateRequest[]) ?? []),
    );
    setReady(true);

    const orgVillas = ((villasRes.data as Villa[]) ?? []).filter(
      (v) => v.org_id === orgId,
    );
    const orgBills = (billsRes.data as Bill[]) ?? [];
    const orgOrders = (ordersRes.data as ServiceOrder[]) ?? [];
    const orgNotifications = (
      (notificationsRes.data as AppNotification[]) ?? []
    ).map((n) => ({
      ...n,
      read_by: Array.isArray(n.read_by) ? n.read_by : [],
    }));

    if (!scheduleSyncedOrgs.has(orgId)) {
      scheduleSyncedOrgs.add(orgId);
      const alerts = buildScheduleAlerts({
        villas: orgVillas,
        bills: orgBills,
        orders: orgOrders,
        existing: orgNotifications,
        profiles: (profilesRes.data as Profile[]) ?? [],
        assignments: (assignRes.data as VillaAssignment[]) ?? [],
        endorsements: (endorsementsRes.data as Endorsement[]) ?? [],
      });
      if (alerts.length) {
        await insertNotifications(
          supabase,
          alerts.map((n) => toInsertRow(n)),
        );
        const { data: freshNotes } = await supabase
          .from("notifications")
          .select("*")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false });
        setNotifications(
          ((freshNotes as AppNotification[]) ?? []).map((n) => ({
            ...n,
            read_by: Array.isArray(n.read_by) ? n.read_by : [],
          })),
        );
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!profile?.id) {
      setLocalReadIds([]);
      return;
    }
    setLocalReadIds(loadLocallyReadIds(profile.id));
  }, [profile?.id]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled || !profile?.org_id) return;
    const supabase = createClient();
    const topic = `org-${profile.org_id}`;

    for (const existing of supabase.getChannels()) {
      if (existing.topic === topic || existing.topic === `realtime:${topic}`) {
        void supabase.removeChannel(existing);
      }
    }

    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `org_id=eq.${profile.org_id}`,
        },
        () => {
          void refreshRef.current();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_orders",
          filter: `org_id=eq.${profile.org_id}`,
        },
        () => {
          void refreshRef.current();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `org_id=eq.${profile.org_id}`,
        },
        () => {
          void refreshRef.current();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, profile?.org_id]);

  const companyEntitled = useMemo(
    () => isCompanyEntitled(organization),
    [organization],
  );

  const requireOrgWrite = useCallback(
    (orgId: string) => {
      const org =
        orgs.find((o) => o.id === orgId) ??
        (organization?.id === orgId ? organization : null);
      if (org?.kind === "company" && !companyEntitled) {
        throw new Error(ENTITLEMENT_BLOCKED_MESSAGE);
      }
    },
    [orgs, organization, companyEntitled],
  );

  const requireCurrentOrgWrite = useCallback(() => {
    if (!profile) return;
    requireOrgWrite(profile.org_id);
  }, [profile, requireOrgWrite]);

  if (!enabled) return empty;

  const villaList = profile
    ? buildVillaList(profile, villas, villaAssignments, orgs)
    : [];
  const visible = villaList.map(
    ({ bucket: _b, orgLabel: _o, ...v }) => v as Villa,
  );
  const allOrgVillas = villas.filter((v) => v.org_id === profile?.org_id);
  const visibleVillaIds = new Set(visible.map((v) => v.id));
  const scopedTasks = tasks.filter((t) => {
    if (t.org_id !== profile?.org_id) return false;
    if (profile?.role === "owner") return true;
    if (!t.villa_id) return true;
    return visibleVillaIds.has(t.villa_id);
  });

  const visibleNotifications = profile
    ? notifications
        .filter((n) => notificationVisibleTo(n, profile.id))
        .map((n) => ({
          ...n,
          read_by: mergeReadBy(n.read_by, profile.id, localReadIds, n.id),
        }))
    : [];

  const unreadNotificationCount = profile
    ? unreadNotifications(
        visibleNotifications,
        profile.id,
        profile.org_id,
      ).length
    : 0;
  const unreadMessageCount = profile
    ? unreadNotifications(
        visibleNotifications,
        profile.id,
        profile.org_id,
      ).filter((n) => n.kind === "message").length
    : 0;

  const markIdsRead = (ids: string[]) => {
    if (!profile || !ids.length) return;
    rememberLocallyRead(profile.id, ids);
    setLocalReadIds((prev) => [...new Set([...prev, ...ids])]);
    setNotifications((prev) =>
      prev.map((n) =>
        ids.includes(n.id)
          ? {
              ...n,
              read_by: Array.from(
                new Set([...(n.read_by ?? []), profile.id]),
              ),
            }
          : n,
      ),
    );
  };

  return {
    ready,
    profile,
    organization,
    companyEntitled,
    orgName: organization?.name ?? "",
    orgKind: organization?.kind ?? null,
    profiles,
    allProfiles,
    orgs,
    villas: visible,
    villaList,
    allOrgVillas,
    contacts,
    tasks: enrichTasks(scopedTasks, visible, profiles),
    bills: enrichBills(
      profile && !canViewAllBills(profile.role)
        ? bills.filter((b) => b.submitted_by === profile.id)
        : bills,
      visible,
      profiles,
    ),
    messages,
    invites,
    villaAssignments,
    memberships,
    endorsements,
    notifications: visibleNotifications,
    serviceOrders,
    unreadNotificationCount,
    unreadMessageCount,
    guestStays: [],
    activeStay: null,
    houseGuides: [],
    supportMessages: [],
    guestDeposits: [],
    guestCharges: [],
    stayPhotos: [],
    stayDateRequests:
      profile?.role === "guest"
        ? stayDateRequests.filter((r) => r.guest_profile_id === profile.id)
        : stayDateRequests,
    refresh,
    markNotificationRead: async (id) => {
      if (!profile) return;
      markIdsRead([id]);
      const supabase = createClient();
      const row = notifications.find((n) => n.id === id);
      const read_by = Array.from(
        new Set([...(row?.read_by ?? []), profile.id]),
      );
      const { error } = await supabase
        .from("notifications")
        .update({ read_by })
        .eq("id", id);
      if (error) {
        // Local clear already applied; keep badge off.
        console.warn("markNotificationRead", error.message);
      }
    },
    markAllNotificationsRead: async (kind) => {
      if (!profile) return;
      const unread = visibleNotifications.filter(
        (n) =>
          !(n.read_by ?? []).includes(profile.id) &&
          (!kind || n.kind === kind),
      );
      if (!unread.length) return;
      markIdsRead(unread.map((n) => n.id));

      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc(
        "mark_my_notifications_read",
        { p_kind: kind ?? null },
      );
      if (rpcError) {
        // Fallback row updates if migration 011 is not applied yet
        await Promise.all(
          unread.map(async (n) => {
            const read_by = Array.from(
              new Set([...(n.read_by ?? []), profile.id]),
            );
            const { error } = await supabase
              .from("notifications")
              .update({ read_by })
              .eq("id", n.id);
            if (error) console.warn("markAllNotificationsRead", error.message);
          }),
        );
      }
    },
    createServiceOrder: async (input) => {
      if (!profile || !canBookServices(profile.role, organization?.kind)) {
        throw new Error("Only company owners or managers can book services.");
      }
      requireCurrentOrgWrite();
      const supabase = createClient();
      const contact = contacts.find((c) => c.id === input.contact_id);
      if (!contact) throw new Error("Contact not found.");
      if (!contact.linked_profile_id) {
        throw new Error(
          "This contact is not on PulseFlow. Link a team member or call them.",
        );
      }
      const villa = input.villa_id
        ? villas.find((v) => v.id === input.villa_id)
        : null;
      const location =
        villa?.name ?? input.location_label?.trim() ?? "Location TBC";
      const serviceType = capitalizeLabel(input.service_type);

      const { data: order, error } = await supabase
        .from("service_orders")
        .insert({
          org_id: profile.org_id,
          contact_id: contact.id,
          staff_profile_id: contact.linked_profile_id,
          ordered_by: profile.id,
          villa_id: villa?.id ?? null,
          location_label: location,
          service_type: serviceType,
          details: input.details?.trim() || null,
          scheduled_date: input.scheduled_date,
          time_start: input.time_start || null,
          time_end: input.time_end || null,
          status: "pending_ack",
        })
        .select("*")
        .single();
      if (error || !order) throw error ?? new Error("Could not create order.");

      const title = `${serviceType} · ${location}`;
      const { data: task } = await supabase
        .from("tasks")
        .insert({
          org_id: profile.org_id,
          villa_id: villa?.id ?? null,
          title,
          priority: "normal",
          assigned_to: contact.linked_profile_id,
          status: "open",
          due_date: input.scheduled_date,
          time_start: input.time_start || null,
          time_end: input.time_end || null,
          created_by: profile.id,
          service_order_id: order.id,
        })
        .select("*")
        .single();

      const { data: msg } = await supabase
        .from("messages")
        .insert({
          org_id: profile.org_id,
          sender_id: profile.id,
          body: `Service booked: ${title}`,
          service_order_id: order.id,
        })
        .select("*")
        .single();

      await supabase
        .from("service_orders")
        .update({
          task_id: task?.id ?? null,
          chat_message_id: msg?.id ?? null,
        })
        .eq("id", order.id);

      await insertNotifications(supabase, [
        {
          org_id: profile.org_id,
          kind: "appointment",
          title: "New service order",
          body: title,
          href: "/jobs",
          entity_id: order.id,
          audience_profile_ids: [contact.linked_profile_id],
        },
      ]);

      // Staff booked on a company villa get property access automatically.
      if (villa?.id && contact.linked_profile_id) {
        const staffProfile = profiles.find(
          (p) => p.id === contact.linked_profile_id,
        );
        if (staffProfile && isStaffApp(staffProfile.role)) {
          const already = villaAssignments.some(
            (a) =>
              a.villa_id === villa.id &&
              a.profile_id === contact.linked_profile_id,
          );
          if (!already) {
            const { error: assignError } = await supabase
              .from("villa_assignments")
              .insert({
                org_id: profile.org_id,
                villa_id: villa.id,
                profile_id: contact.linked_profile_id,
              });
            if (assignError) {
              console.warn("villa_assignments insert", assignError.message);
            }
          }
        }
      }

      await refresh();
      return order as ServiceOrder;
    },
    agreeServiceOrder: async (orderId) => {
      if (!profile) throw new Error("Not signed in.");
      const supabase = createClient();
      let order = serviceOrders.find((o) => o.id === orderId) ?? null;
      if (order) requireOrgWrite(order.org_id);
      if (!order) {
        const { data } = await supabase
          .from("service_orders")
          .select("*")
          .eq("id", orderId)
          .single();
        order = (data as ServiceOrder | null) ?? null;
      }
      if (order) requireOrgWrite(order.org_id);
      const { error } = await supabase
        .from("service_orders")
        .update({
          status: "agreed",
          agreed_at: new Date().toISOString(),
        })
        .eq("id", orderId);
      if (error) throw error;

      if (order?.ordered_by && order.ordered_by !== profile.id) {
        await insertNotifications(supabase, [
          {
            org_id: profile.org_id,
            kind: "appointment",
            title: `${profile.full_name} agreed`,
            body: `${order.service_type} · ${formatOrderWhen(order)}`,
            href: "/jobs",
            entity_id: orderId,
            audience_profile_ids: [order.ordered_by],
          },
        ]);
      }
      await refresh();
    },
    cancelServiceOrder: async (orderId) => {
      if (!profile) throw new Error("Not signed in.");
      const supabase = createClient();
      let order = serviceOrders.find((o) => o.id === orderId) ?? null;
      if (!order) {
        const { data } = await supabase
          .from("service_orders")
          .select("*")
          .eq("id", orderId)
          .single();
        order = (data as ServiceOrder | null) ?? null;
      }
      if (!order) throw new Error("Order not found.");
      requireOrgWrite(order.org_id);
      if (!canCancelServiceOrder(profile, order, organization?.kind ?? null)) {
        throw new Error("You cannot cancel this job.");
      }
      const declined =
        order.staff_profile_id === profile.id &&
        order.status === "pending_ack";
      const { error } = await supabase
        .from("service_orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);
      if (error) throw error;
      if (order.task_id) {
        await supabase
          .from("tasks")
          .update({
            status: "done",
            completed_at: new Date().toISOString(),
          })
          .eq("id", order.task_id);
      }
      const location = order.location_label ?? "location";
      const when = formatOrderWhen(order);
      await supabase.from("messages").insert({
        org_id: order.org_id,
        sender_id: profile.id,
        body: declined
          ? `Declined - ${order.service_type} at ${location} (${when})`
          : `Cancelled - ${order.service_type} at ${location} (${when})`,
        service_order_id: orderId,
      });
      const audience = declined
        ? [
            order.ordered_by,
            ...ownerManagerIds(profiles, order.org_id),
          ].filter((id) => id !== profile.id)
        : [order.staff_profile_id, order.ordered_by].filter(
            (id): id is string => Boolean(id) && id !== profile.id,
          );
      const uniqueAudience = [...new Set(audience)];
      if (uniqueAudience.length) {
        await insertNotifications(supabase, [
          toInsertRow(
            makeNotification({
              org_id: order.org_id,
              kind: "appointment",
              title: declined ? "Job declined" : "Job cancelled",
              body: `${order.service_type} · ${location} · ${when}`,
              href: "/jobs",
              entity_id: orderId,
              audience_profile_ids: uniqueAudience,
            }),
          ),
        ]);
      }
      await refresh();
    },
    completeServiceOrder: async (orderId) => {
      if (!profile) throw new Error("Not signed in.");
      const supabase = createClient();
      let order = serviceOrders.find((o) => o.id === orderId) ?? null;
      if (!order) {
        const { data } = await supabase
          .from("service_orders")
          .select("*")
          .eq("id", orderId)
          .single();
        order = (data as ServiceOrder | null) ?? null;
      }
      if (!order) throw new Error("Order not found.");
      requireOrgWrite(order.org_id);

      const { error } = await supabase
        .from("service_orders")
        .update({ status: "done" })
        .eq("id", orderId);
      if (error) throw error;
      if (order.task_id) {
        await supabase
          .from("tasks")
          .update({
            status: "done",
            completed_at: new Date().toISOString(),
          })
          .eq("id", order.task_id);
      }

      const location = order.location_label ?? "location";
      const when = formatOrderWhen(order);
      await supabase.from("messages").insert({
        org_id: order.org_id,
        sender_id: profile.id,
        body: `✅ Done - ${order.service_type} at ${location} (${when})`,
        service_order_id: orderId,
      });

      const audience = ownerManagerIds(profiles, order.org_id).filter(
        (id) => id !== profile.id,
      );
      if (audience.length) {
        await insertNotifications(supabase, [
          {
            org_id: order.org_id,
            kind: "appointment",
            title: `${profile.full_name} completed a job`,
            body: `${order.service_type} · ${location} · ${when}`,
            href: "/jobs",
            entity_id: orderId,
            audience_profile_ids: audience,
          },
        ]);
      }
      await refresh();
    },
    updateVilla: async (id, patch) => {
      const villa = villas.find((v) => v.id === id);
      if (villa) requireOrgWrite(villa.org_id);
      const supabase = createClient();
      const { error } = await supabase
        .from("villas")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      if (villa) {
        const alerts = buildVillaDateNotifications({
          org_id: villa.org_id,
          villaId: villa.id,
          villaName: villa.name,
          before: {
            check_in: villa.check_in,
            check_out: villa.check_out,
          },
          patch,
          audience_profile_ids: villaOpsAudience(
            villa.org_id,
            villa.id,
            profiles,
            villaAssignments,
          ),
        });
        if (alerts.length) {
          await insertNotifications(
            supabase,
            alerts.map((n) => toInsertRow(n)),
          );
        }
      }
      await refresh();
    },
    createVilla: async (input) => {
      if (!profile || !canCreateVillas(profile.role)) {
        throw new Error("You cannot add villas.");
      }
      let scope =
        input.scope ??
        (profile.role === "owner" && organization?.kind === "company"
          ? "company"
          : "personal");
      if (personalVillasOnly(profile.role, organization?.kind)) scope = "personal";

      let orgId = profile.org_id;
      if (scope === "personal") {
        orgId = await ensurePersonalOrgId(profile);
      } else {
        requireOrgWrite(orgId);
      }

      const supabase = createClient();
      let photo_url = input.photo_url ?? null;
      if (photo_url?.startsWith("data:")) {
        photo_url = null;
      }

      const { error } = await supabase.from("villas").insert({
        org_id: orgId,
        name: input.name,
        area: input.area ?? null,
        location_url: input.location_url.trim(),
        description: input.description?.trim() || null,
        photo_url,
        status: input.status ?? "available",
        created_by: profile.id,
      });
      if (error) throw error;
      await refresh();
    },
    deleteVilla: async (id) => {
      const villa = villas.find((v) => v.id === id);
      if (villa) requireOrgWrite(villa.org_id);
      const supabase = createClient();
      const { error } = await supabase.from("villas").delete().eq("id", id);
      if (error) throw error;
      await refresh();
    },
    mergeVillaToCompany: async (villaId) => {
      if (!profile) return;
      requireOrgWrite(profile.org_id);
      const supabase = createClient();
      const { error } = await supabase
        .from("villas")
        .update({ org_id: profile.org_id })
        .eq("id", villaId);
      if (error) throw error;
      await refresh();
    },
    updateOrganizationName: async (name) => {
      if (!profile) throw new Error("Not signed in.");
      if (profile.role !== "owner") {
        throw new Error("Only the owner can rename the company.");
      }
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Company name is required.");
      requireOrgWrite(profile.org_id);
      const supabase = createClient();
      const { error } = await supabase
        .from("organizations")
        .update({ name: trimmed })
        .eq("id", profile.org_id);
      if (error) throw error;
      await refresh();
    },
    createTask: async (input) => {
      if (!profile) return;
      requireCurrentOrgWrite();
      const supabase = createClient();
      const title = capitalizeLabel(input.title);
      const { data: inserted, error } = await supabase
        .from("tasks")
        .insert({
          org_id: profile.org_id,
          created_by: profile.id,
          status: "open",
          ...input,
          title,
        })
        .select("id")
        .single();
      if (error) throw error;
      const alerts = buildTaskCreateNotifications({
        org_id: profile.org_id,
        taskId: inserted.id,
        title,
        priority: input.priority,
        assigned_to: input.assigned_to ?? null,
        created_by: profile.id,
        memberIds: orgMemberIds(profiles, profile.org_id),
      });
      if (alerts.length) {
        await insertNotifications(
          supabase,
          alerts.map((n) => toInsertRow(n)),
        );
      }
      await refresh();
    },
    setTaskStatus: async (id, status) => {
      const task = tasks.find((t) => t.id === id);
      if (task) requireOrgWrite(task.org_id);
      const supabase = createClient();
      const { error } = await supabase
        .from("tasks")
        .update({
          status,
          completed_at: status === "done" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
      if (
        task &&
        status === "done" &&
        profile &&
        task.assigned_to === profile.id &&
        task.created_by !== profile.id
      ) {
        await insertNotifications(supabase, [
          toInsertRow(
            makeNotification({
              org_id: task.org_id,
              kind: "task_completed",
              title: "Task completed",
              body: task.title,
              href: "/tasks",
              entity_id: task.id,
              audience_profile_ids: [task.created_by],
            }),
          ),
        ]);
      }
      await refresh();
    },
    createContact: async (input) => {
      if (!profile) return;
      requireCurrentOrgWrite();
      const supabase = createClient();
      const { error } = await supabase
        .from("contacts")
        .insert({ org_id: profile.org_id, ...input });
      if (error) throw error;
      await refresh();
    },
    updateContact: async (id, patch) => {
      requireCurrentOrgWrite();
      const supabase = createClient();
      const { error } = await supabase.from("contacts").update(patch).eq("id", id);
      if (error) throw error;
      await refresh();
    },
    deleteContact: async (id) => {
      requireCurrentOrgWrite();
      const supabase = createClient();
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
      await refresh();
    },
    createBill: async (input) => {
      if (!profile) return;
      requireCurrentOrgWrite();
      const supabase = createClient();
      const due_date = input.due_date?.trim() || null;
      const currency = normalizeBillCurrency(input.currency);
      const { data: inserted, error } = await supabase
        .from("bills")
        .insert({
          org_id: profile.org_id,
          submitted_by: profile.id,
          currency,
          status: "pending",
          category: input.category ?? "other",
          description: input.description,
          amount: input.amount,
          villa_id: input.villa_id,
          due_date,
          receipt_photo_url: input.receipt_photo_url ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      const alerts = buildBillCreateNotifications({
        org_id: profile.org_id,
        billId: inserted.id,
        description: input.description,
        amount: input.amount,
        currency,
        due_date,
        submitted_by: profile.id,
        managerIds: ownerManagerIds(profiles, profile.org_id),
      });
      if (alerts.length) {
        await insertNotifications(
          supabase,
          alerts.map((n) => toInsertRow(n)),
        );
      }
      await refresh();
    },
    setBillStatus: async (id, status) => {
      requireCurrentOrgWrite();
      const bill = bills.find((b) => b.id === id);
      const supabase = createClient();
      const { error } = await supabase.from("bills").update({ status }).eq("id", id);
      if (error) throw error;
      if (
        bill &&
        status === "paid" &&
        profile &&
        bill.submitted_by !== profile.id
      ) {
        await insertNotifications(supabase, [
          toInsertRow(
            makeNotification({
              org_id: bill.org_id,
              kind: "bill_paid",
              title: "Bill marked paid",
              body: `${bill.description} · ${formatMoney(Number(bill.amount), bill.currency)}`,
              href: "/bills",
              entity_id: bill.id,
              audience_profile_ids: [bill.submitted_by],
            }),
          ),
        ]);
      }
      await refresh();
    },
    sendMessage: async (body) => {
      if (!profile) return;
      requireCurrentOrgWrite();
      const supabase = createClient();
      const { data: inserted, error } = await supabase
        .from("messages")
        .insert({
          org_id: profile.org_id,
          sender_id: profile.id,
          body,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { mentionedProfileIds, hasEveryoneMention } = await import(
        "@/lib/mentions"
      );
      const orgProfiles = profiles.filter((p) => p.org_id === profile.org_id);
      const mentioned = mentionedProfileIds(body, orgProfiles).filter(
        (id) => id !== profile.id,
      );
      const others = orgProfiles
        .filter((p) => p.id !== profile.id)
        .map((p) => p.id);
      const preview = body.trim().slice(0, 80);
      const first = profile.full_name.split(" ")[0];
      const msgId = inserted?.id ?? null;
      const rows = [];
      if (mentioned.length) {
        rows.push({
          org_id: profile.org_id,
          kind: "message",
          title: hasEveryoneMention(body)
            ? `${first} mentioned @everyone`
            : `${first} mentioned you`,
          body: preview,
          href: "/messages",
          entity_id: msgId,
          audience_profile_ids: mentioned,
          read_by: [],
        });
      }
      const rest = others.filter((id) => !mentioned.includes(id));
      if (rest.length) {
        rows.push({
          org_id: profile.org_id,
          kind: "message",
          title: `New message from ${first}`,
          body: preview,
          href: "/messages",
          entity_id: msgId,
          audience_profile_ids: rest,
          read_by: [],
        });
      }
      if (rows.length) {
        await insertNotifications(
          supabase,
          rows.map((r) => ({
            org_id: r.org_id,
            kind: r.kind as NotificationInsert["kind"],
            title: r.title,
            body: r.body,
            href: r.href,
            entity_id: r.entity_id,
            audience_profile_ids: r.audience_profile_ids,
          })),
        );
      }
      await refresh();
    },
    uploadReceipt: async (file) => {
      if (!profile) return null;
      requireCurrentOrgWrite();
      const supabase = createClient();
      const path = `${profile.org_id}/${profile.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      return data.publicUrl;
    },
    uploadVillaPhoto: async (file) => {
      if (!profile) return null;
      requireCurrentOrgWrite();
      const supabase = createClient();
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${profile.org_id}/${profile.id}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("villas").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("villas").getPublicUrl(path);
      return data.publicUrl;
    },
    createInvite: async (input) => {
      if (!profile) throw new Error("Not signed in.");
      if (organization?.kind !== "company") {
        throw new Error("Invites are only available for company workspaces.");
      }
      const allowed =
        input.role === "guest"
          ? canInviteGuest(profile.role, organization.kind)
            ? (["guest"] as const)
            : []
          : invitableStaffRoles(profile.role, organization.kind);
      if (!(allowed as readonly string[]).includes(input.role)) {
        throw new Error("You cannot invite someone with that role.");
      }
      requireCurrentOrgWrite();
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
      requireCurrentOrgWrite();
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
      requireCurrentOrgWrite();
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
    castEndorsement: async (toProfileId, stars, note) => {
      if (!profile) throw new Error("Not signed in.");
      requireCurrentOrgWrite();
      const supabase = createClient();
      const week_key = weekKey();
      const { error } = await supabase.from("endorsements").upsert(
        {
          org_id: profile.org_id,
          from_profile_id: profile.id,
          to_profile_id: toProfileId,
          stars,
          week_key,
          note: note?.trim() || null,
        },
        { onConflict: "org_id,from_profile_id,to_profile_id,week_key" },
      );
      if (error) throw error;
      if (toProfileId !== profile.id) {
        await insertNotifications(supabase, [
          toInsertRow(
            buildEndorsementReceivedNotification({
              org_id: profile.org_id,
              fromProfileId: profile.id,
              fromName: profile.full_name,
              toProfileId,
              stars,
              note,
              weekKey: week_key,
            }),
          ),
        ]);
      }
      await refresh();
    },
    sendSupportMessage: async () => {
      throw new Error("Support chat needs migration 023 on Supabase.");
    },
    upsertHouseGuide: async () => {
      throw new Error("House guide needs migration 023 on Supabase.");
    },
    requestStayDates: async (input) => {
      if (!profile) throw new Error("Not signed in.");
      if (profile.role !== "guest") {
        throw new Error("Only guests can request dates.");
      }
      const today = new Date();
      const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      if (input.check_in < todayIso) {
        throw new Error("Check-in can't be in the past.");
      }
      if (input.check_out <= input.check_in) {
        throw new Error("Check-out must be after check-in.");
      }
      const supabase = createClient();
      const { data: inserted, error } = await supabase
        .from("stay_date_requests")
        .insert({
          org_id: profile.org_id,
          villa_id: input.villa_id,
          guest_profile_id: profile.id,
          check_in: input.check_in,
          check_out: input.check_out,
          note: input.note?.trim() || null,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) {
        if (
          error.message.includes("does not exist") ||
          error.code === "42P01" ||
          error.code === "PGRST205"
        ) {
          throw new Error("Date requests need migration 023 on Supabase.");
        }
        throw error;
      }
      const managers = ownerManagerIds(profiles, profile.org_id);
      if (managers.length && inserted?.id) {
        await insertNotifications(
          supabase,
          [
            makeNotification({
              org_id: profile.org_id,
              kind: "appointment",
              title: "Date request",
              body: `${profile.full_name} requested stay dates`,
              href: "/villas",
              entity_id: input.villa_id,
              audience_profile_ids: managers,
            }),
          ].map((n) => toInsertRow(n)),
        );
      }
      await refresh();
    },
    addStayPhoto: async () => {
      throw new Error("Stay photos need migration 023 on Supabase.");
    },
  };
}
