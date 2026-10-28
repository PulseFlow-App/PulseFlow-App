import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";

export const runtime = "nodejs";

/** Block another profile in this org (hides their chat for the blocker). */
export async function POST(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { blockedId?: string };
  try {
    body = (await request.json()) as { blockedId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const blockedId = body.blockedId?.trim();
  if (!blockedId || blockedId === user.id) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.org_id) {
    return NextResponse.json({ error: "Profile missing." }, { status: 400 });
  }

  const { error } = await supabase.from("user_blocks").upsert(
    {
      org_id: me.org_id,
      blocker_id: user.id,
      blocked_id: blockedId,
    },
    { onConflict: "blocker_id,blocked_id" },
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const url = new URL(request.url);
  const blockedId = url.searchParams.get("blockedId")?.trim();
  if (!blockedId) {
    return NextResponse.json({ error: "Missing blockedId." }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  if (isDemoMode(request.headers.get("cookie"))) {
    return NextResponse.json({ blocks: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_id, created_at")
    .eq("blocker_id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ blocks: data ?? [] });
}
