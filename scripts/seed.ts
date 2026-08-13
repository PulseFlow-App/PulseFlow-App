/**
 * Seed Supabase with org, auth users, villas, contacts, tasks, bills, messages,
 * personal workspace, service orders, notifications, memberships.
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: npm run seed
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import {
  demoBills,
  demoContacts,
  demoEndorsements,
  demoMemberships,
  demoMessages,
  demoNotifications,
  demoOrg,
  demoPersonalOrg,
  demoProfiles,
  demoServiceOrders,
  demoTasks,
  demoVillaAssignments,
  demoVillas,
  DEMO_CLEANER_ID,
  DEMO_EMPLOYEE_ID,
  DEMO_OWNER_ID,
  DEMO_ORG_ID,
  DEMO_PERSONAL_ORG_ID,
} from "../src/lib/demo/seed-data";
import { companyTrialEndsAt } from "../src/lib/auth/helpers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser(email: string, password: string, id: string) {
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = listed?.users.find((u) => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    id,
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!.id;
}

async function main() {
  const ownerAuthId = await ensureUser(
    "owner@pulseflow.site",
    "TestPass123!",
    DEMO_OWNER_ID,
  );
  const managerAuthId = await ensureUser(
    "manager@pulseflow.site",
    "TestPass123!",
    DEMO_EMPLOYEE_ID,
  );
  const cleanerAuthId = await ensureUser(
    "employee@pulseflow.site",
    "TestPass123!",
    DEMO_CLEANER_ID,
  );

  const idMap: Record<string, string> = {
    [DEMO_OWNER_ID]: ownerAuthId,
    [DEMO_EMPLOYEE_ID]: managerAuthId,
    [DEMO_CLEANER_ID]: cleanerAuthId,
  };

  const remap = <T extends { id?: string }>(id: string | null | undefined) =>
    id ? idMap[id] ?? id : id;

  const { error: orgError } = await admin.from("organizations").upsert([
    {
      id: DEMO_ORG_ID,
      name: demoOrg.name,
      kind: demoOrg.kind,
      created_at: demoOrg.created_at,
      trial_ends_at: companyTrialEndsAt(),
      subscription_status: "trialing",
      billing_email: "owner@pulseflow.site",
    },
    {
      id: DEMO_PERSONAL_ORG_ID,
      name: demoPersonalOrg.name,
      kind: "personal",
      created_at: demoPersonalOrg.created_at,
      subscription_status: "none",
      trial_ends_at: null,
    },
  ]);
  if (orgError) throw orgError;

  const seedProfiles = demoProfiles
    .filter((p) => idMap[p.id])
    .map((p) => ({
      ...p,
      id: idMap[p.id],
      personal_org_id: p.personal_org_id
        ? remap(p.personal_org_id)
        : p.personal_org_id,
    }));

  const { error: profileError } = await admin.from("profiles").upsert(seedProfiles);
  if (profileError) throw profileError;

  const tables = [
    "endorsements",
    "org_memberships",
    "notifications",
    "service_orders",
    "messages",
    "bills",
    "tasks",
    "contacts",
    "villa_assignments",
    "villas",
  ] as const;

  for (const table of tables) {
    await admin.from(table).delete().eq("org_id", DEMO_ORG_ID);
  }
  await admin.from("villas").delete().eq("org_id", DEMO_PERSONAL_ORG_ID);

  const villas = demoVillas.map((v) => ({
    ...v,
    created_by: remap(v.created_by) as string,
  }));
  const { error: villaError } = await admin.from("villas").insert(villas);
  if (villaError) throw villaError;

  const contacts = demoContacts.map((c) => ({
    ...c,
    linked_profile_id: c.linked_profile_id
      ? (remap(c.linked_profile_id) as string)
      : null,
  }));
  const { error: contactError } = await admin.from("contacts").insert(contacts);
  if (contactError) throw contactError;

  const tasks = demoTasks.map((t) => ({
    ...t,
    assigned_to: t.assigned_to ? (remap(t.assigned_to) as string) : null,
    created_by: remap(t.created_by) as string,
  }));
  const { error: taskError } = await admin.from("tasks").insert(tasks);
  if (taskError) throw taskError;

  const bills = demoBills.map((b) => ({
    ...b,
    submitted_by: remap(b.submitted_by) as string,
  }));
  const { error: billError } = await admin.from("bills").insert(bills);
  if (billError) throw billError;

  const messages = demoMessages.map((m) => ({
    ...m,
    sender_id: remap(m.sender_id) as string,
  }));
  const { error: messageError } = await admin.from("messages").insert(messages);
  if (messageError) throw messageError;

  const assignments = demoVillaAssignments
    .filter((a) => a.org_id === DEMO_ORG_ID)
    .map((a) => ({
      ...a,
      profile_id: remap(a.profile_id) as string,
    }));
  const { error: assignError } = await admin
    .from("villa_assignments")
    .insert(assignments);
  if (assignError) throw assignError;

  const orders = demoServiceOrders.map((o) => ({
    ...o,
    staff_profile_id: o.staff_profile_id
      ? (remap(o.staff_profile_id) as string)
      : null,
    ordered_by: remap(o.ordered_by) as string,
  }));
  const { error: orderError } = await admin.from("service_orders").insert(orders);
  if (orderError) throw orderError;

  const notifications = demoNotifications.map((n) => ({
    ...n,
    audience_profile_ids: n.audience_profile_ids?.map(
      (id) => remap(id) as string,
    ),
    read_by: (n.read_by ?? []).map((id) => remap(id) as string),
  }));
  const { error: notifError } = await admin
    .from("notifications")
    .insert(notifications);
  if (notifError) throw notifError;

  const memberships = demoMemberships
    .filter((m) => m.org_id === DEMO_ORG_ID && idMap[m.profile_id])
    .map((m) => ({
      org_id: m.org_id,
      profile_id: remap(m.profile_id) as string,
      role: m.role,
      joined_at: m.joined_at,
    }));
  const { error: memError } = await admin
    .from("org_memberships")
    .upsert(memberships, { onConflict: "org_id,profile_id" });
  if (memError) throw memError;

  const endorsements = demoEndorsements
    .filter((e) => e.org_id === DEMO_ORG_ID)
    .map((e) => ({
      ...e,
      from_profile_id: remap(e.from_profile_id) as string,
      to_profile_id: remap(e.to_profile_id) as string,
    }));
  const { error: endError } = await admin.from("endorsements").insert(endorsements);
  if (endError) throw endError;

  console.log("Seed complete.");
  console.log("  owner@pulseflow.site / TestPass123!");
  console.log("  manager@pulseflow.site / TestPass123!");
  console.log("  employee@pulseflow.site / TestPass123!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
