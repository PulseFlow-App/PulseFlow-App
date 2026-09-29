import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMcpAuth } from "@/lib/mcp/auth";

export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  villa_id: z.string().uuid().nullable().optional(),
  priority: z.enum(["normal", "urgent"]).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  time_start: z.string().nullable().optional(),
  time_end: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

/** List tasks in the token's org. */
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "tasks:read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? "40") || 40),
  );

  const admin = createAdminClient();
  let q = admin
    .from("tasks")
    .select(
      "id, title, status, priority, due_date, time_start, time_end, notes, assigned_to, villa_id, created_at, completed_at, verify_submitted_at",
    )
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && ["open", "pending_verify", "done"].includes(status)) {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data ?? [] });
}

/** Create a task in the token's org (as the token owner). */
export async function POST(request: Request) {
  const auth = await requireMcpAuth(request, "tasks:write");
  if (auth instanceof NextResponse) return auth;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (body.villa_id) {
    const { data: villa } = await admin
      .from("villas")
      .select("id")
      .eq("id", body.villa_id)
      .eq("org_id", auth.orgId)
      .maybeSingle();
    if (!villa) {
      return NextResponse.json({ error: "Villa not in this org." }, { status: 400 });
    }
  }

  if (body.assigned_to) {
    const { data: assignee } = await admin
      .from("profiles")
      .select("id")
      .eq("id", body.assigned_to)
      .eq("org_id", auth.orgId)
      .maybeSingle();
    if (!assignee) {
      return NextResponse.json(
        { error: "Assignee not in this org." },
        { status: 400 },
      );
    }
  }

  const { data, error } = await admin
    .from("tasks")
    .insert({
      org_id: auth.orgId,
      title: body.title,
      villa_id: body.villa_id ?? null,
      priority: body.priority ?? "normal",
      assigned_to: body.assigned_to ?? null,
      due_date: body.due_date ?? null,
      time_start: body.time_start ?? null,
      time_end: body.time_end ?? null,
      notes: body.notes?.trim() || null,
      status: "open",
      created_by: auth.profileId,
    })
    .select(
      "id, title, status, priority, due_date, assigned_to, villa_id, created_at",
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create task." },
      { status: 500 },
    );
  }

  return NextResponse.json({ task: data }, { status: 201 });
}
