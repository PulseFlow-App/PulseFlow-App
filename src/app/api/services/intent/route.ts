import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  intent: z.enum(["hire", "work"]),
});

/** Signed-in people who have not chosen yet can say they look for staff, or do the work. */
export async function POST(request: Request) {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Sign in on the live account." }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role;
  if (body.intent === "work" && role !== "staff" && role !== "cleaner") {
    return NextResponse.json({ error: "This account looks for help. It is not a maintenance account." }, { status: 400 });
  }
  const { error } = await admin.from("profiles").update({ services_intent: body.intent }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not save the choice." }, { status: 500 });
  return NextResponse.json({ ok: true, intent: body.intent });
}
