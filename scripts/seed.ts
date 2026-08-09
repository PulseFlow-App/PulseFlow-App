/**
 * Seed Supabase with org, auth users, villas, contacts, tasks, bills, messages.
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
  demoAccounts,
  demoBills,
  demoContacts,
  demoMessages,
  demoOrg,
  demoProfiles,
  demoTasks,
  demoVillas,
  DEMO_EMPLOYEE_ID,
  DEMO_OWNER_ID,
  DEMO_ORG_ID,
} from "../src/lib/demo/seed-data";

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

  const { error: orgError } = await admin.from("organizations").upsert({
    id: DEMO_ORG_ID,
    name: demoOrg.name,
    kind: demoOrg.kind,
    created_at: demoOrg.created_at,
  });
  if (orgError) throw orgError;

  const idMap = {
    [DEMO_OWNER_ID]: ownerAuthId,
    [DEMO_EMPLOYEE_ID]: managerAuthId,
  };

  const profiles = demoProfiles.map((p) => ({
    ...p,
    id: idMap[p.id as keyof typeof idMap] ?? p.id,
  }));

  const { error: profileError } = await admin.from("profiles").upsert(profiles);
  if (profileError) throw profileError;

  await admin.from("messages").delete().eq("org_id", DEMO_ORG_ID);
  await admin.from("bills").delete().eq("org_id", DEMO_ORG_ID);
  await admin.from("tasks").delete().eq("org_id", DEMO_ORG_ID);
  await admin.from("contacts").delete().eq("org_id", DEMO_ORG_ID);
  await admin.from("villa_assignments").delete().eq("org_id", DEMO_ORG_ID);
  await admin.from("villas").delete().eq("org_id", DEMO_ORG_ID);

  const villas = demoVillas.map((v) => ({
    ...v,
    created_by: idMap[v.created_by as keyof typeof idMap] ?? v.created_by,
  }));
  const { error: villaError } = await admin.from("villas").insert(villas);
  if (villaError) throw villaError;

  const { error: contactError } = await admin
    .from("contacts")
    .insert(demoContacts);
  if (contactError) throw contactError;

  const tasks = demoTasks.map((t) => ({
    ...t,
    assigned_to: t.assigned_to
      ? idMap[t.assigned_to as keyof typeof idMap] ?? t.assigned_to
      : null,
    created_by: idMap[t.created_by as keyof typeof idMap] ?? t.created_by,
  }));
  const { error: taskError } = await admin.from("tasks").insert(tasks);
  if (taskError) throw taskError;

  const bills = demoBills.map((b) => ({
    ...b,
    submitted_by:
      idMap[b.submitted_by as keyof typeof idMap] ?? b.submitted_by,
  }));
  const { error: billError } = await admin.from("bills").insert(bills);
  if (billError) throw billError;

  const messages = demoMessages.map((m) => ({
    ...m,
    sender_id: idMap[m.sender_id as keyof typeof idMap] ?? m.sender_id,
  }));
  const { error: messageError } = await admin.from("messages").insert(messages);
  if (messageError) throw messageError;

  const assignments = [
    {
      org_id: DEMO_ORG_ID,
      villa_id: villas[0].id,
      profile_id: managerAuthId,
    },
    {
      org_id: DEMO_ORG_ID,
      villa_id: villas[1].id,
      profile_id: managerAuthId,
    },
    {
      org_id: DEMO_ORG_ID,
      villa_id: villas[4].id,
      profile_id: managerAuthId,
    },
  ];
  const { error: assignError } = await admin
    .from("villa_assignments")
    .insert(assignments);
  if (assignError) throw assignError;

  console.log("Seed complete.");
  console.log("  owner@pulseflow.site / TestPass123!");
  console.log("  manager@pulseflow.site / TestPass123!");
  void demoAccounts;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
