import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const choiceSchema = z.object({
  choice: z.enum(["merged", "separate"]),
});

type LinkChoice = "merged" | "separate" | null;

async function actorId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({
      choice: null,
      prompt: false,
      secondApp: null,
      companyName: null,
    });
  }
  const id = await actorId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_link, job_search_updated_at")
    .eq("id", id)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profile missing." }, { status: 404 });

  const choice = (profile.account_link as LinkChoice) ?? null;
  const { data: memberships } = await admin
    .from("org_memberships")
    .select("org_id, joined_at")
    .eq("profile_id", id);
  const orgIds = [...new Set((memberships ?? []).map((row) => row.org_id as string))];
  const { data: orgs } = orgIds.length
    ? await admin.from("organizations").select("id, name, kind").in("id", orgIds)
    : { data: [] as { id: string; name: string; kind: string }[] };
  const companies = (orgs ?? []).filter((org) => org.kind === "company");
  const companyIds = new Set(companies.map((org) => org.id));
  const companyJoined = (memberships ?? [])
    .filter((row) => companyIds.has(row.org_id as string))
    .map((row) => row.joined_at as string)
    .sort()[0];

  const { data: firstRequest } = await admin
    .from("service_requests")
    .select("created_at")
    .or(`created_by.eq.${id},target_profile_id.eq.${id}`)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const stamps = [profile.job_search_updated_at as string | null, firstRequest?.created_at as string | undefined]
    .filter((value): value is string => Boolean(value))
    .sort();
  const servicesAt = stamps[0];
  const both = Boolean(companyJoined && servicesAt);
  const secondApp = !both
    ? null
    : servicesAt > companyJoined
      ? "services"
      : "pulse";

  return NextResponse.json({
    choice,
    prompt: choice == null && secondApp != null,
    secondApp,
    companyName: companies[0]?.name ?? null,
  });
}

export async function POST(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const id = await actorId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: z.infer<typeof choiceSchema>;
  try {
    body = choiceSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ account_link: body.choice }).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not save the choice." }, { status: 500 });
  return NextResponse.json({ ok: true, choice: body.choice });
}
