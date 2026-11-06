import { NextResponse } from "next/server";
import { z } from "zod";
import { storeChatPhoto } from "@/lib/pros/chat-photo";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const postSchema = z.object({
  id: z.string().uuid(),
  unlock: z.literal(true).optional(),
  body: z.string().trim().max(2000).optional(),
  photo: z.string().max(2_000_000).optional(),
});

type RequestRow = {
  id: string;
  title: string;
  created_by: string;
  target_profile_id: string;
  target_name: string;
  reply_message: string | null;
  chat_open?: boolean | null;
};

async function actor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function loadRequest(id: string): Promise<RequestRow | null | "missing"> {
  const admin = createAdminClient();
  const withChat = await admin
    .from("service_requests")
    .select("id, title, created_by, target_profile_id, target_name, reply_message, chat_open")
    .eq("id", id)
    .maybeSingle();
  if (!withChat.error) return (withChat.data as RequestRow | null) ?? null;
  if (!/chat_open/.test(withChat.error.message)) return "missing";
  const plain = await admin
    .from("service_requests")
    .select("id, title, created_by, target_profile_id, target_name, reply_message")
    .eq("id", id)
    .maybeSingle();
  if (plain.error) return "missing";
  return (plain.data as RequestRow | null) ?? null;
}

function isParty(row: RequestRow, userId: string) {
  return row.created_by === userId || row.target_profile_id === userId;
}

function isOpen(row: RequestRow) {
  return Boolean(row.chat_open || row.reply_message);
}

export async function GET(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Chat is not available." }, { status: 400 });
  }
  const user = await actor();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const row = await loadRequest(id);
  if (row === "missing") return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!row || !isParty(row, user.id)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const admin = createAdminClient();
  const peerId = row.created_by === user.id ? row.target_profile_id : row.created_by;
  const { data: peer } = await admin.from("profiles").select("full_name").eq("id", peerId).maybeSingle();
  const peerName =
    row.created_by === user.id ? row.target_name : ((peer?.full_name as string | undefined) ?? "");

  if (!isOpen(row)) {
    return NextResponse.json({
      open: false,
      accepted: Boolean(row.reply_message),
      title: row.title,
      peerName,
      messages: [],
    });
  }

  const { data, error } = await admin
    .from("service_request_messages")
    .select("id, sender_id, body, photo_url, created_at")
    .eq("service_request_id", row.id)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) {
    return NextResponse.json({
      open: true,
      accepted: Boolean(row.reply_message),
      title: row.title,
      peerName,
      messages: [],
      error: "Chat is not ready yet.",
    });
  }
  return NextResponse.json({
    open: true,
    accepted: Boolean(row.reply_message),
    title: row.title,
    peerName,
    messages: (data ?? []).map((item) => ({
      id: item.id as string,
      senderId: item.sender_id as string,
      body: (item.body as string) ?? "",
      photoUrl: (item.photo_url as string | null) ?? null,
      createdAt: item.created_at as string,
    })),
  });
}

export async function POST(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Chat is not available." }, { status: 400 });
  }
  const user = await actor();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = rateLimit(`services-chat:${user.id}:${clientIp(request)}`, { limit: 40, windowMs: 60_000 });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }
  const row = await loadRequest(body.id);
  if (row === "missing" || !row || !isParty(row, user.id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  if (body.unlock) {
    const { error } = await admin.from("service_requests").update({ chat_open: true }).eq("id", row.id);
    if (error) return NextResponse.json({ error: "Chat is not ready yet." }, { status: 503 });
    return NextResponse.json({ ok: true, open: true });
  }

  if (!isOpen(row)) return NextResponse.json({ error: "Chat is closed." }, { status: 403 });
  const text = body.body?.trim() ?? "";
  const photo = body.photo?.startsWith("data:image/") ? body.photo : null;
  if (!text && !photo) return NextResponse.json({ error: "Write a message or add a photo." }, { status: 400 });

  let photoUrl: string | null = null;
  if (photo) {
    photoUrl = await storeChatPhoto(admin, row.id, photo);
    if (!photoUrl) return NextResponse.json({ error: "Could not save that photo." }, { status: 400 });
  }

  const { error } = await admin.from("service_request_messages").insert({
    service_request_id: row.id,
    sender_id: user.id,
    body: text,
    photo_url: photoUrl,
  });
  if (error) return NextResponse.json({ error: "Could not send that." }, { status: 503 });

  const other = row.created_by === user.id ? row.target_profile_id : row.created_by;
  try {
    const { sendWebPush } = await import("@/lib/push/web-push");
    await sendWebPush({
      title: row.title,
      body: text || "Photo",
      href: `/chat/${row.id}`,
      tag: `services-chat:${row.id}`,
      kind: "message",
      org_id: user.id,
      audience_profile_ids: [other],
    });
  } catch {
    // The message is saved even when the phone alert cannot be sent.
  }

  return NextResponse.json({ ok: true });
}
