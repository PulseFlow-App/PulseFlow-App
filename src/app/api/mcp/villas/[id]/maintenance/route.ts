import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMcpAuth } from "@/lib/mcp/auth";

export const runtime = "nodejs";

const LOG_COLUMNS =
  "id, villa_id, item, logged_on, description, vendor, photo_url, created_at";

const createSchema = z.object({
  item: z.string().trim().min(1).max(200),
  logged_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  description: z.string().max(4000).nullable().optional(),
  vendor: z.string().max(200).nullable().optional(),
  photo_url: z.string().url().max(2000).nullable().optional(),
});

function blankToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** List maintenance log entries for one property (newest first). */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMcpAuth(request, "villas:read");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const url = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? "40") || 40),
  );

  const admin = createAdminClient();
  const villa = await villaInOrg(admin, id, auth.orgId);
  if (!villa) {
    return NextResponse.json({ error: "Villa not in this org." }, { status: 404 });
  }

  const { data, error } = await admin
    .from("villa_maintenance_logs")
    .select(LOG_COLUMNS)
    .eq("org_id", auth.orgId)
    .eq("villa_id", id)
    .order("logged_on", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}

/** Add a maintenance log entry. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMcpAuth(request, "villas:write");
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== "owner" && auth.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const villa = await villaInOrg(admin, id, auth.orgId);
  if (!villa) {
    return NextResponse.json({ error: "Villa not in this org." }, { status: 404 });
  }

  const loggedOn =
    body.logged_on ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await admin
    .from("villa_maintenance_logs")
    .insert({
      org_id: auth.orgId,
      villa_id: id,
      item: body.item.trim(),
      logged_on: loggedOn,
      description: blankToNull(body.description),
      vendor: blankToNull(body.vendor),
      photo_url: blankToNull(body.photo_url),
      created_by: auth.profileId,
    })
    .select(LOG_COLUMNS)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not add maintenance entry." },
      { status: 500 },
    );
  }

  return NextResponse.json({ log: data });
}

async function villaInOrg(
  admin: ReturnType<typeof createAdminClient>,
  villaId: string,
  orgId: string,
) {
  const { data } = await admin
    .from("villas")
    .select("id")
    .eq("id", villaId)
    .eq("org_id", orgId)
    .maybeSingle();
  return data;
}
