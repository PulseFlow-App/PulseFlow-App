import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, tokenMatches } from "@/lib/pros/admin-lock";

export async function GET() {
  const jar = await cookies();
  return NextResponse.json({ ok: tokenMatches(jar.get(ADMIN_COOKIE)?.value) });
}
