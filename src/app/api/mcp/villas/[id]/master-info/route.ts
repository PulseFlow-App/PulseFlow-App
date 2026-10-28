import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMcpAuth } from "@/lib/mcp/auth";

export const runtime = "nodejs";

const MASTER_COLUMNS_BASE =
  "id, villa_id, utilities_notes, service_providers_notes, access_notes, key_contacts_notes, tax_notes, handoff_notes, updated_at";
const MASTER_COLUMNS = `${MASTER_COLUMNS_BASE}, allow_manager_view`;

const optionalText = (max: number) =>
  z.string().max(max).nullable().optional();

const patchSchema = z
  .object({
    utilities_notes: optionalText(8000),
    service_providers_notes: optionalText(8000),
    access_notes: optionalText(8000),
    key_contacts_notes: optionalText(8000),
    tax_notes: optionalText(8000),
    handoff_notes: optionalText(8000),
    allow_manager_view: z.boolean().optional(),
  })
  .refine((body) => Object.values(body).some((v) => v !== undefined), {
    message: "Send at least one master-info field.",
  });

type MasterPatch = z.infer<typeof patchSchema>;

const EMPTY_MASTER = {
  utilities_notes: null,
  service_providers_notes: null,
  access_notes: null,
  key_contacts_notes: null,
  tax_notes: null,
  handoff_notes: null,
  allow_manager_view: true,
};

function blankToNull(value: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function missingAllowManagerColumn(message: string) {
  return /allow_manager_view/i.test(message);
}

/** Team-only master ops handoff for one property. */
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

  type MasterRow = {
    id?: string;
    villa_id?: string;
    utilities_notes?: string | null;
    service_providers_notes?: string | null;
    access_notes?: string | null;
    key_contacts_notes?: string | null;
    tax_notes?: string | null;
    handoff_notes?: string | null;
    allow_manager_view?: boolean | null;
    updated_at?: string | null;
  };

  let row: MasterRow | null = null;
  {
    const full = await admin
      .from("villa_master_info")
      .select(MASTER_COLUMNS)
      .eq("org_id", auth.orgId)
      .eq("villa_id", id)
      .maybeSingle();
    if (full.error && missingAllowManagerColumn(full.error.message)) {
      const base = await admin
        .from("villa_master_info")
        .select(MASTER_COLUMNS_BASE)
        .eq("org_id", auth.orgId)
        .eq("villa_id", id)
        .maybeSingle();
      if (base.error) {
        return NextResponse.json({ error: base.error.message }, { status: 500 });
      }
      row = base.data
        ? { ...(base.data as MasterRow), allow_manager_view: true }
        : null;
    } else if (full.error) {
      return NextResponse.json({ error: full.error.message }, { status: 500 });
    } else {
      row = (full.data as MasterRow | null) ?? null;
    }
  }

  if (row && auth.role === "manager" && row.allow_manager_view === false) {
    return NextResponse.json(
      { error: "Master info is owner-only for this property." },
      { status: 403 },
    );
  }

  return NextResponse.json({
    kind: "team_master_info",
    note: "Team master info only. Guest house guide (Wi-Fi/gate) is a separate resource at /instructions.",
    master_info: row ?? {
      villa_id: id,
      ...EMPTY_MASTER,
      updated_at: null,
    },
  });
}

/** Create or update team-only master info. Omitted fields stay as they are. */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMcpAuth(request, "villas:write");
  if (auth instanceof NextResponse) return auth;

  if (auth.role !== "owner" && auth.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: MasterPatch;
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

  let existing: { id: string; allow_manager_view?: boolean | null } | null =
    null;
  {
    const found = await admin
      .from("villa_master_info")
      .select("id, allow_manager_view")
      .eq("org_id", auth.orgId)
      .eq("villa_id", id)
      .maybeSingle();
    if (found.error && missingAllowManagerColumn(found.error.message)) {
      const fallback = await admin
        .from("villa_master_info")
        .select("id")
        .eq("org_id", auth.orgId)
        .eq("villa_id", id)
        .maybeSingle();
      if (fallback.error) {
        return NextResponse.json(
          { error: fallback.error.message },
          { status: 500 },
        );
      }
      existing = fallback.data
        ? { id: fallback.data.id, allow_manager_view: true }
        : null;
    } else if (found.error) {
      return NextResponse.json({ error: found.error.message }, { status: 500 });
    } else {
      existing = found.data;
    }
  }

  if (
    existing &&
    auth.role === "manager" &&
    existing.allow_manager_view === false
  ) {
    return NextResponse.json(
      { error: "Master info is owner-only for this property." },
      { status: 403 },
    );
  }

  const patch: Record<string, string | boolean | null> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (key === "allow_manager_view") {
      if (auth.role === "owner" && typeof value === "boolean") {
        patch.allow_manager_view = value;
      }
      continue;
    }
    if (typeof value === "string" || value === null) {
      patch[key] = blankToNull(value);
    }
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json(
      { error: "Send at least one editable master-info field." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const runWrite = (bodyPatch: Record<string, string | boolean | null>) =>
    existing
      ? admin
          .from("villa_master_info")
          .update({ ...bodyPatch, updated_at: now })
          .eq("id", existing.id)
          .eq("org_id", auth.orgId)
          .select(MASTER_COLUMNS_BASE)
          .single()
      : admin
          .from("villa_master_info")
          .insert({
            org_id: auth.orgId,
            villa_id: id,
            utilities_notes: null,
            service_providers_notes: null,
            access_notes: null,
            key_contacts_notes: null,
            tax_notes: null,
            handoff_notes: null,
            ...bodyPatch,
            updated_at: now,
          })
          .select(MASTER_COLUMNS_BASE)
          .single();

  let { data, error } = await runWrite(patch);
  if (error && missingAllowManagerColumn(error.message) && "allow_manager_view" in patch) {
    const { allow_manager_view: _omit, ...rest } = patch;
    ({ data, error } = await runWrite(rest));
  }

  if (error || !data) {
    const message = error?.message ?? "Could not save master info.";
    if (missingAllowManagerColumn(message)) {
      return NextResponse.json(
        {
          error:
            "Master info needs migration 053 (allow_manager_view) on Supabase.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    kind: "team_master_info",
    note: "Updated team master info only. Guest house guide was not changed — use PUT /instructions for Wi-Fi, gate, checkout.",
    master_info: {
      ...data,
      allow_manager_view:
        typeof patch.allow_manager_view === "boolean"
          ? patch.allow_manager_view
          : (existing?.allow_manager_view ?? true),
    },
  });
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
