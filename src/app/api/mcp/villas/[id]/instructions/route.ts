import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMcpAuth } from "@/lib/mcp/auth";

export const runtime = "nodejs";

const GUIDE_COLUMNS =
  "id, villa_id, wifi_ssid, wifi_password, gate_code, bins_notes, quiet_hours, checkout_checklist, extra_notes, updated_at";

const optionalText = (max: number) =>
  z.string().max(max).nullable().optional();

const patchSchema = z
  .object({
    wifi_ssid: optionalText(200),
    wifi_password: optionalText(200),
    gate_code: optionalText(120),
    bins_notes: optionalText(2000),
    quiet_hours: optionalText(500),
    checkout_checklist: optionalText(4000),
    extra_notes: optionalText(4000),
  })
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "Send at least one instruction field.",
  });

type GuidePatch = z.infer<typeof patchSchema>;

const EMPTY_GUIDE = {
  wifi_ssid: null,
  wifi_password: null,
  gate_code: null,
  bins_notes: null,
  quiet_hours: null,
  checkout_checklist: null,
  extra_notes: null,
};

function blankToNull(value: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Guest-facing house guide for one property. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMcpAuth(request, "villas:read");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const admin = createAdminClient();
  const villa = await villaInOrg(admin, id, auth.orgId);
  if (!villa) {
    return NextResponse.json({ error: "Villa not in this org." }, { status: 404 });
  }

  const { data, error } = await admin
    .from("house_guides")
    .select(GUIDE_COLUMNS)
    .eq("org_id", auth.orgId)
    .eq("villa_id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    instructions: data ?? { villa_id: id, ...EMPTY_GUIDE, updated_at: null },
  });
}

/** Create or update the guest-facing house guide. Omitted fields stay as they are. */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMcpAuth(request, "villas:write");
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let body: GuidePatch;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const villa = await villaInOrg(admin, id, auth.orgId);
  if (!villa) {
    return NextResponse.json({ error: "Villa not in this org." }, { status: 404 });
  }

  const patch: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) patch[key] = blankToNull(value);
  }

  const now = new Date().toISOString();
  const { data: existing, error: findError } = await admin
    .from("house_guides")
    .select("id")
    .eq("org_id", auth.orgId)
    .eq("villa_id", id)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  const write = existing
    ? admin
        .from("house_guides")
        .update({ ...patch, updated_at: now })
        .eq("id", existing.id)
        .eq("org_id", auth.orgId)
    : admin.from("house_guides").insert({
        org_id: auth.orgId,
        villa_id: id,
        ...EMPTY_GUIDE,
        ...patch,
        updated_at: now,
      });

  const { data, error } = await write.select(GUIDE_COLUMNS).single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not save instructions." },
      { status: 500 },
    );
  }

  return NextResponse.json({ instructions: data });
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
