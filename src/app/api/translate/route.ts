import { NextResponse } from "next/server";
import { z } from "zod";
import { isLocale } from "@/lib/i18n";
import { translateUserContent } from "@/lib/translate/server";

const bodySchema = z.object({
  text: z.string().min(1).max(4000),
  target: z.string(),
  source: z.string().optional(),
});

export async function POST(request: Request) {
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

  if (target === "en") {
    return NextResponse.json({ translated: text });
  }

  try {
    const translated = await translateUserContent(text, target, source);
    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 502 });
  }
}
