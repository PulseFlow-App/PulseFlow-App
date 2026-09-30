import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMcpAuth } from "@/lib/mcp/auth";
import { buildOrderChatBody } from "@/lib/service-orders";
import { capitalizeLabel } from "@/lib/format-label";
import { isTaskAssignableRole } from "@/lib/roles";
import { formatWorkWindow } from "@/lib/notifications";
import type { UserRole } from "@/lib/design-tokens";

export const runtime = "nodejs";

const createSchema = z
  .object({
    service_type: z.string().trim().min(1).max(120),
    staff_profile_id: z.string().uuid().optional(),
    contact_id: z.string().uuid().optional(),
    villa_id: z.string().uuid().nullable().optional(),
    location_label: z.string().trim().max(200).nullable().optional(),
    details: z.string().max(2000).nullable().optional(),
    scheduled_date: z.string().nullable().optional(),
    time_start: z.string().nullable().optional(),
    time_end: z.string().nullable().optional(),
  })
  .refine((b) => Boolean(b.staff_profile_id || b.contact_id), {
    message: "staff_profile_id or contact_id is required",
  });

/** List service orders (jobs) in the token's org. */
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "jobs:read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? "40") || 40),
  );

  const admin = createAdminClient();
  let q = admin
    .from("service_orders")
    .select(
      "id, service_type, status, scheduled_date, time_start, time_end, location_label, staff_profile_id, ordered_by, created_at, details",
    )
    .eq("org_id", auth.orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (
    status &&
    ["pending_ack", "agreed", "done", "cancelled"].includes(status)
  ) {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data ?? [] });
}

/** Create a job (service order) + linked task + request chat post. */
export async function POST(request: Request) {
  const auth = await requireMcpAuth(request, "jobs:write");
  if (auth instanceof NextResponse) return auth;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid request. Need service_type and staff_profile_id or contact_id.",
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  let staffProfileId = body.staff_profile_id ?? null;
  let contactId = body.contact_id ?? null;
  let assigneeName = "Teammate";

  if (contactId) {
    const { data: contact } = await admin
      .from("contacts")
      .select("id, name, linked_profile_id")
      .eq("id", contactId)
      .eq("org_id", auth.orgId)
      .maybeSingle();
    if (!contact) {
      return NextResponse.json({ error: "Contact not in this org." }, { status: 400 });
    }
    if (!contact.linked_profile_id && !staffProfileId) {
      return NextResponse.json(
        { error: "Contact is not linked to a Pulse teammate." },
        { status: 400 },
      );
    }
    staffProfileId = staffProfileId ?? contact.linked_profile_id;
    assigneeName = contact.name;
  }

  if (!staffProfileId) {
    return NextResponse.json(
      { error: "staff_profile_id or linked contact required." },
      { status: 400 },
    );
  }

  const { data: staff } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", staffProfileId)
    .eq("org_id", auth.orgId)
    .maybeSingle();

  if (!staff || !isTaskAssignableRole(staff.role as UserRole)) {
    return NextResponse.json(
      { error: "Assignee must be a teammate in this org (not a guest)." },
      { status: 400 },
    );
  }
  if (!contactId) assigneeName = staff.full_name;

  let villaName: string | null = null;
  if (body.villa_id) {
    const { data: villa } = await admin
      .from("villas")
      .select("id, name")
      .eq("id", body.villa_id)
      .eq("org_id", auth.orgId)
      .maybeSingle();
    if (!villa) {
      return NextResponse.json({ error: "Villa not in this org." }, { status: 400 });
    }
    villaName = villa.name;
  }

  const serviceType = capitalizeLabel(body.service_type);
  const location =
    villaName ?? body.location_label?.trim() ?? "Location TBC";
  const scheduledDate = body.scheduled_date?.trim() || null;
  const when =
    formatWorkWindow(scheduledDate, body.time_start ?? null, body.time_end ?? null) ??
    "";

  const { data: order, error: orderError } = await admin
    .from("service_orders")
    .insert({
      org_id: auth.orgId,
      contact_id: contactId,
      staff_profile_id: staffProfileId,
      ordered_by: auth.profileId,
      villa_id: body.villa_id ?? null,
      location_label: location,
      service_type: serviceType,
      details: body.details?.trim() || null,
      scheduled_date: scheduledDate,
      time_start: body.time_start || null,
      time_end: body.time_end || null,
      status: "pending_ack",
    })
    .select(
      "id, service_type, status, scheduled_date, time_start, time_end, location_label, staff_profile_id, ordered_by, created_at, details",
    )
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? "Could not create job." },
      { status: 500 },
    );
  }

  const title = `${serviceType} · ${location}`;
  const { data: task } = await admin
    .from("tasks")
    .insert({
      org_id: auth.orgId,
      villa_id: body.villa_id ?? null,
      title,
      notes: body.details?.trim() || null,
      priority: "normal",
      assigned_to: staffProfileId,
      status: "open",
      due_date: scheduledDate,
      time_start: body.time_start || null,
      time_end: body.time_end || null,
      created_by: auth.profileId,
      service_order_id: order.id,
    })
    .select("id")
    .single();

  const chatBody = buildOrderChatBody({
    assigneeName,
    serviceType,
    location,
    when,
    details: body.details?.trim() || null,
    orderedBy: auth.fullName,
  });
  const { data: msg } = await admin
    .from("messages")
    .insert({
      org_id: auth.orgId,
      sender_id: auth.profileId,
      body: chatBody,
      service_order_id: order.id,
      channel: "request",
    })
    .select("id")
    .single();

  await admin
    .from("service_orders")
    .update({
      task_id: task?.id ?? null,
      chat_message_id: msg?.id ?? null,
    })
    .eq("id", order.id);

  return NextResponse.json(
    { job: order, task_id: task?.id ?? null },
    { status: 201 },
  );
}
