import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMcpAuth } from "@/lib/mcp/auth";
import { clearTaskVerifyFields } from "@/lib/tasks/verify";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["open", "pending_verify", "done"]),
});

/** Update a task's status (owners/managers via MCP token). */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMcpAuth(request, "tasks:write");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing task id." }, { status: 400 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: task, error: findError } = await admin
    .from("tasks")
    .select("id, org_id, status, title")
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }
  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const completed_at =
    body.status === "done" ? new Date().toISOString() : null;
  const verifyClear = body.status === "open" ? clearTaskVerifyFields() : {};

  const { data, error } = await admin
    .from("tasks")
    .update({
      status: body.status,
      completed_at,
      ...verifyClear,
    })
    .eq("id", id)
    .eq("org_id", auth.orgId)
    .select(
      "id, title, status, priority, due_date, assigned_to, villa_id, completed_at, created_at",
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not update task." },
      { status: 500 },
    );
  }

  return NextResponse.json({ task: data });
}
