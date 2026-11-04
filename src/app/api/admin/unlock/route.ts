import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  adminKey,
  adminToken,
  keyMatches,
  wordMatches,
} from "@/lib/pros/admin-lock";

export async function POST(request: Request) {
  if (!adminKey()) {
    return NextResponse.json(
      {
        error:
          "Admin access is not configured. Set PROS_ADMIN_KEY on the server (Vercel Environment Variables) and redeploy.",
      },
      { status: 503 },
    );
  }
  let secret = "";
  let word = "";
  try {
    const body = (await request.json()) as { string?: unknown; word?: unknown };
    secret = typeof body.string === "string" ? body.string.slice(0, 200) : "";
    word = typeof body.word === "string" ? body.word.slice(0, 40) : "";
  } catch {
    secret = "";
    word = "";
  }
  if (!keyMatches(secret) || !wordMatches(word)) {
    return NextResponse.json({ error: "Those credentials are not valid." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, adminToken(), adminCookieOptions());
  return response;
}
