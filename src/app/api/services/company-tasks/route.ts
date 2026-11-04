import { NextResponse } from "next/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Company tasks for today, only after the person merges the two apps. */
export async function GET() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ tasks: [] });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_link")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.account_link !== "merged") return NextResponse.json({ tasks: [] });

  const { data: memberships } = await admin
    .from("org_memberships")
    .select("org_id")
    .eq("profile_id", user.id);
  const orgIds = [...new Set((memberships ?? []).map((row) => row.org_id as string))];
  if (!orgIds.length) return NextResponse.json({ tasks: [] });
  const { data: orgs } = await admin.from("organizations").select("id, kind").in("id", orgIds);
  const companyIds = (orgs ?? []).filter((org) => org.kind === "company").map((org) => org.id as string);
  if (!companyIds.length) return NextResponse.json({ tasks: [] });

  const today = todayIso();
  const { data: tasks } = await admin
    .from("tasks")
    .select("id, title, due_date, priority, status, villa_id, org_id")
    .eq("assigned_to", user.id)
    .in("status", ["open", "pending_verify"])
    .in("org_id", companyIds)
    .order("due_date", { ascending: true })
    .limit(20);
  const due = (tasks ?? []).filter((task) => {
    const day = task.due_date ? String(task.due_date).slice(0, 10) : null;
    return !day || day <= today;
  });
  const villaIds = [...new Set(due.map((task) => task.villa_id).filter(Boolean))] as string[];
  const { data: villas } = villaIds.length
    ? await admin.from("villas").select("id, name").in("id", villaIds)
    : { data: [] as { id: string; name: string }[] };
  const names = new Map((villas ?? []).map((villa) => [villa.id as string, villa.name as string]));

  return NextResponse.json({
    tasks: due.map((task) => ({
      id: task.id,
      title: task.title,
      due: task.due_date ? String(task.due_date).slice(0, 10) : null,
      priority: task.priority,
      property: task.villa_id ? names.get(task.villa_id as string) ?? "" : "",
    })),
  });
}
