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
  Task,
  Villa,
  VillaAssignment,
} from "@/lib/types";
import {
  canBookServices,
  canCreateVillas,
  personalVillasOnly,
} from "@/lib/roles";
import {
  ENTITLEMENT_BLOCKED_MESSAGE,
  isCompanyEntitled,
} from "@/lib/billing/entitlement";
import {
  notificationVisibleTo,
  unreadNotifications,
} from "@/lib/notifications";
import {
  loadLocallyReadIds,
  mergeReadBy,
  rememberLocallyRead,
} from "@/lib/notifications-read";
import { formatOrderWhen } from "@/lib/service-orders";

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
    uploadVillaPhoto: async () => null,
    createInvite: async () => {
      throw new Error("Connect Supabase to create invites.");
    },
    setVillaAssignments: async () => undefined,
    setVillaAssignees: async () => undefined,
    castEndorsement: async () => undefined,
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
    const p = profileRow as Profile;
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
    setReady(true);
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

  const requireCompanyWrite = useCallback(() => {
    if (organization?.kind === "company" && !companyEntitled) {
      throw new Error(ENTITLEMENT_BLOCKED_MESSAGE);
    }
  }, [organization, companyEntitled]);

  if (!enabled) return empty;

  const villaList = profile
    ? buildVillaList(profile, villas, villaAssignments, orgs)
    : [];
  const visible = villaList.map(
    ({ bucket: _b, orgLabel: _o, ...v }) => v as Villa,
  );
  const allOrgVillas = villas.filter((v) => v.org_id === profile?.org_id);

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
    tasks: enrichTasks(tasks, visible, profiles),
    bills: enrichBills(bills, visible, profiles),
    messages,
    invites,
    villaAssignments,
    memberships,
    endorsements,
    notifications: visibleNotifications,
    serviceOrders,
    unreadNotificationCount,
    unreadMessageCount,
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
      requireCompanyWrite();
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

      const { data: order, error } = await supabase
        .from("service_orders")
        .insert({
          org_id: profile.org_id,
          contact_id: contact.id,
          staff_profile_id: contact.linked_profile_id,
          ordered_by: profile.id,
          villa_id: villa?.id ?? null,
          location_label: location,
          service_type: input.service_type.trim(),
          details: input.details?.trim() || null,
          scheduled_date: input.scheduled_date,
          time_start: input.time_start || null,
          time_end: input.time_end || null,
          status: "pending_ack",
        })
        .select("*")
        .single();
      if (error || !order) throw error ?? new Error("Could not create order.");

      const title = `${order.service_type} · ${location}`;
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

      await supabase.from("notifications").insert({
        org_id: profile.org_id,
        kind: "appointment",
        title: "New service order",
        body: title,
        href: "/jobs",
        entity_id: order.id,
        audience_profile_ids: [contact.linked_profile_id],
      });

      await refresh();
      return order as ServiceOrder;
    },
    agreeServiceOrder: async (orderId) => {
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
      const { error } = await supabase
        .from("service_orders")
        .update({
          status: "agreed",
          agreed_at: new Date().toISOString(),
        })
        .eq("id", orderId);
      if (error) throw error;

      if (order?.ordered_by && order.ordered_by !== profile.id) {
        await supabase.from("notifications").insert({
          org_id: profile.org_id,
          kind: "appointment",
          title: `${profile.full_name} agreed`,
          body: `${order.service_type} · ${formatOrderWhen(order)}`,
          href: "/jobs",
          entity_id: orderId,
          audience_profile_ids: [order.ordered_by],
        });
      }
      await refresh();
    },
    completeServiceOrder: async (orderId) => {
      if (!profile) throw new Error("Not signed in.");
      const supabase = createClient();
      const order = serviceOrders.find((o) => o.id === orderId);
      const { error } = await supabase
        .from("service_orders")
        .update({ status: "done" })
        .eq("id", orderId);
      if (error) throw error;
      if (order?.task_id) {
        await supabase
          .from("tasks")
          .update({
            status: "done",
            completed_at: new Date().toISOString(),
          })
          .eq("id", order.task_id);
      }
      await refresh();
    },
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
        requireCompanyWrite();
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
      const supabase = createClient();
      const { error } = await supabase.from("villas").delete().eq("id", id);
      if (error) throw error;
      await refresh();
    },
    mergeVillaToCompany: async (villaId) => {
      if (!profile) return;
      requireCompanyWrite();
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
        category: input.category ?? "other",
        description: input.description,
        amount: input.amount,
        villa_id: input.villa_id,
        due_date: input.due_date ?? null,
        receipt_photo_url: input.receipt_photo_url ?? null,
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
        await supabase.from("notifications").insert(rows);
      }
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
    uploadVillaPhoto: async (file) => {
      if (!profile) return null;
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
      requireCompanyWrite();
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
    castEndorsement: async (toProfileId, stars, note) => {
      if (!profile) throw new Error("Not signed in.");
      const supabase = createClient();
      const now = new Date();
      const week_key = `${now.getUTCFullYear()}-W${Math.ceil(
        ((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
          Date.UTC(now.getUTCFullYear(), 0, 1)) /
          86400000 +
          1) /
          7,
      )}`;
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
      await refresh();
    },
  };
}
