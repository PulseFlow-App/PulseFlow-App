import { NextResponse } from "next/server";
import { z } from "zod";
import { isLocale } from "@/lib/i18n";
import { translateUserContent } from "@/lib/translate/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";

const bodySchema = z.object({
  text: z.string().min(1).max(4000),
  target: z.string(),
  source: z.string().optional(),
});

export async function POST(request: Request) {
  if (!isDemoMode()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { text, target, source } = parsed.data;
  if (!isLocale(target)) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }

  try {
    const translated = await translateUserContent(text, target, source);
    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 502 });
  }
}
