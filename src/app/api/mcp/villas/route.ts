import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMcpAuth } from "@/lib/mcp/auth";
import { isMissingVillaDetailsColumn } from "@/lib/villas/property-details";

export const runtime = "nodejs";

/** List villas in the token's org. */
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "villas:read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? "50") || 50),
  );
  const status = url.searchParams.get("status");

  const admin = createAdminClient();
  let q = admin
    .from("villas")
    .select(
      "id, name, status, cleaning_status, check_in, check_out, area, property_type, updated_at",
    )
    .eq("org_id", auth.orgId)
    .order("name")
    .limit(limit);

  if (
    status &&
    ["available", "occupied", "turnover", "maintenance"].includes(status)
  ) {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ villas: data ?? [] });
}

const optionalText = z.string().trim().max(2000).nullable().optional();
const optionalUrl = z.string().trim().url().max(2000).nullable().optional();

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  area: z.string().trim().max(200).nullable().optional(),
  location_url: z.string().trim().url().max(2000),
  description: optionalText,
  photo_url: optionalUrl,
  status: z.enum(["available", "occupied", "turnover", "maintenance"]).optional(),
  property_type: z
    .enum(["villa", "bungalow", "house", "apartment", "studio", "office", "other"])
    .nullable()
    .optional(),
  sq_m: z.number().positive().max(100000).nullable().optional(),
  bedrooms: z.number().int().min(0).max(100).nullable().optional(),
  bathrooms: z.number().min(0).max(100).nullable().optional(),
  max_guests: z.number().int().min(1).max(500).nullable().optional(),
  floors: z.number().int().min(1).max(100).nullable().optional(),
  has_pool: z.boolean().nullable().optional(),
  has_garden: z.boolean().nullable().optional(),
  pet_friendly: z.boolean().nullable().optional(),
  has_wifi: z.boolean().nullable().optional(),
  setting: z.enum(["community", "standalone"]).nullable().optional(),
  parking: z.enum(["none", "street", "private"]).nullable().optional(),
  kitchen: z.enum(["none", "basic", "full"]).nullable().optional(),
  aircon: z.enum(["none", "partial", "full"]).nullable().optional(),
  view: z.enum(["sea", "jungle", "pool", "garden", "mountain"]).nullable().optional(),
});

const DETAIL_KEYS = [
  "property_type",
  "sq_m",
  "bedrooms",
  "bathrooms",
  "max_guests",
  "floors",
  "has_pool",
  "has_garden",
  "pet_friendly",
  "has_wifi",
  "setting",
  "parking",
  "kitchen",
  "aircon",
  "view",
] as const;

function sniffImage(buf: Buffer) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return "image/png";
  }
  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/** Copy a public photo into villa storage so the listing does not depend on a hotlink. */
async function storeVillaPhoto(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  profileId: string,
  photoUrl: string,
) {
  const remote = await fetch(photoUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
    headers: { Accept: "image/*" },
  });
  if (!remote.ok) throw new Error(`Photo download failed (${remote.status}).`);
  const buf = Buffer.from(await remote.arrayBuffer());
  if (buf.length < 32 || buf.length > 4_000_000) {
    throw new Error("Photo must be under 4 MB.");
  }
  const type = sniffImage(buf);
  if (!type) throw new Error("Photo must be a JPEG, PNG, or WebP.");
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const path = `${orgId}/${profileId}/${Date.now()}-property.${ext}`;
  const { error } = await admin.storage.from("villas").upload(path, buf, {
    contentType: type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return admin.storage.from("villas").getPublicUrl(path).data.publicUrl;
}

/** Create a property in the token's org. */
export async function POST(request: Request) {
  const auth = await requireMcpAuth(request, "villas:write");
  if (auth instanceof NextResponse) return auth;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  let photoUrl: string | null = null;
  let photoWarning: string | null = null;
  if (body.photo_url) {
    try {
      photoUrl = await storeVillaPhoto(admin, auth.orgId, auth.profileId, body.photo_url);
    } catch (e) {
      photoWarning = e instanceof Error ? e.message : "Could not save the photo.";
    }
  }

  const row: Record<string, unknown> = {
    org_id: auth.orgId,
    name: body.name,
    area: body.area?.trim() || null,
    location_url: body.location_url,
    description: body.description?.trim() || null,
    photo_url: photoUrl,
    status: body.status ?? "available",
    created_by: auth.profileId,
  };
  for (const key of DETAIL_KEYS) {
    const value = body[key];
    if (value !== undefined) row[key] = value;
  }

  let { data, error } = await admin
    .from("villas")
    .insert(row)
    .select("id, name, area, location_url, description, photo_url, status, property_type")
    .single();

  if (error && isMissingVillaDetailsColumn(error.message)) {
    for (const key of DETAIL_KEYS) delete row[key];
    const retry = await admin
      .from("villas")
      .insert(row)
      .select("id, name, area, location_url, description, photo_url, status, property_type")
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create property." },
      { status: 500 },
    );
  }

  return NextResponse.json({ villa: data, photo_warning: photoWarning });
}
