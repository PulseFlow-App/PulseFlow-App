/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_USER_COOKIE, isDemoMode } from "@/lib/env";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/join",
  "/merge",
  "/handoff",
  "/auth/callback",
  "/u",
  "/terms",
  "/privacy",
  "/support",
  "/api/auth",
  "/api/account",
  "/api/invites",
  "/api/handoff",
  "/api/public",
  "/api/billing/webhook",
  // Vercel Cron / ops: route checks Authorization: Bearer CRON_SECRET.
  "/api/cron",
  // Agent calls use a pfmcp_ connection key, not a browser session.
  // Route handlers check that key (or, for /api/mcp/tokens, the signed-in user).
  "/api/mcp",
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const demoCookie = request.cookies.get(DEMO_USER_COOKIE);
  const demoSession =
    isDemoMode(request.headers.get("cookie")) || Boolean(demoCookie?.value);

  if (demoSession) {
    if (!demoCookie && !isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Demo seats stay on /home from "/". Plain /login and /register must stay
    // reachable so a visitor can leave the demo and sign in for real.
    const demoPrefill = Boolean(request.nextUrl.searchParams.get("demo"));
    if (
      demoCookie &&
      (pathname === "/login" || pathname === "/register") &&
      !demoPrefill
    ) {
      // Clear the demo seat on the response so Sign in / Register are never
      // masked by a leftover marketing-demo cookie.
      supabaseResponse.cookies.set(DEMO_USER_COOKIE, "", {
        path: "/",
        maxAge: 0,
      });
      return supabaseResponse;
    }
    // Visiting `/` should always show the public welcome (moon toggle + info
    // cards), not skip into a sticky demo home. Clear the demo seat here;
    // demos still start from "Try the … demo" / See the demo → /login?demo=.
    if (demoCookie && pathname === "/") {
      supabaseResponse.cookies.set(DEMO_USER_COOKIE, "", {
        path: "/",
        maxAge: 0,
      });
      return supabaseResponse;
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Real session on /login?demo=* must reach the login page so the user can
  // switch into a demo seat (marketing "Open demo" while already signed in).
  const demoPrefill = Boolean(request.nextUrl.searchParams.get("demo"));
  if (
    user &&
    (pathname === "/" ||
      pathname === "/register" ||
      (pathname === "/login" && !demoPrefill))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
