import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import {
  PUSH_CATEGORIES,
  normalizePushPrefs,
  type PushCategory,
} from "@/lib/push/categories";

export const runtime = "nodejs";

const patchSchema = z.object({
  prefs: z.record(z.string(), z.boolean()),
});

export async function GET() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ prefs: normalizePushPrefs({}) });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("push_prefs")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    // Column may not exist until migration 041 is applied.
    if (error.message?.includes("push_prefs")) {
      return NextResponse.json({ prefs: normalizePushPrefs({}) });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    prefs: normalizePushPrefs(data?.push_prefs),
  });
}

export async function PATCH(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Push preferences require a live account." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid preferences." }, { status: 400 });
  }

  const allowed = new Set<string>(PUSH_CATEGORIES);
  const patch: Partial<Record<PushCategory, boolean>> = {};
  for (const [key, value] of Object.entries(body.prefs)) {
    if (allowed.has(key) && typeof value === "boolean") {
      patch[key as PushCategory] = value;
    }
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No valid categories." }, { status: 400 });
  }

  const { data: current, error: readError } = await supabase
    .from("profiles")
    .select("push_prefs")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    return NextResponse.json(
      {
        error: readError.message?.includes("push_prefs")
          ? "Run migration 041_push_prefs on Supabase, then try again."
          : readError.message,
      },
      { status: 500 },
    );
  }

  const next = {
    ...normalizePushPrefs(current?.push_prefs),
    ...patch,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ push_prefs: next })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, prefs: next });
}
