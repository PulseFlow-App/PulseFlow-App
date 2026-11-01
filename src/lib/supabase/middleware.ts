/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_USER_COOKIE, isDemoMode } from "@/lib/env";
import {
  isMarketplaceHost,
  marketplaceOriginForHost,
  marketplacePath,
  prosReturnPath,
} from "@/lib/pros/paths";

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
  // Read-only Education mode UI mock for screenshots / design review (no data).
  "/education-preview",
  "/pros",
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

const MARKET_PREFIXES = ["/find", "/request", "/requests", "/p", "/c", "/a", "/reply", "/claim", "/admin", "/start"];

function onMarketplaceHost(request: NextRequest) {
  return isMarketplaceHost(request.headers.get("host") ?? "");
}

function isMarketplacePath(pathname: string) {
  if (pathname === "/") return true;
  return MARKET_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function rewriteMarketplace(request: NextRequest, session: NextResponse) {
  const url = request.nextUrl.clone();
  const path = request.nextUrl.pathname;
  url.pathname = path === "/" ? "/pros" : `/pros${path}`;
  const rewritten = NextResponse.rewrite(url);
  for (const cookie of session.cookies.getAll()) {
    rewritten.cookies.set(cookie);
  }
  return rewritten;
}

function redirectMarketplace(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = marketplacePath(request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  const prosHost = onMarketplaceHost(request);
  if (pathname === "/pros" || pathname.startsWith("/pros/")) {
    if (prosHost) return redirectMarketplace(request);
    const origin = marketplaceOriginForHost(
      request.headers.get("host") ?? "",
      request.nextUrl.protocol,
    );
    const dest = new URL(
      `${marketplacePath(pathname)}${request.nextUrl.search}`,
      origin,
    );
    return NextResponse.redirect(dest);
  }
  if (prosHost && isMarketplacePath(pathname)) {
    return rewriteMarketplace(request, supabaseResponse);
  }
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
    if (demoCookie && pathname === "/" && !prosHost) {
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
  const returnTo = prosReturnPath(request.nextUrl.searchParams.get("next"));
  if (user && pathname === "/" && !prosHost) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }
  if (user && pathname === "/register") {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }
  if (user && pathname === "/login" && !demoPrefill) {
    const url = request.nextUrl.clone();
    url.pathname = returnTo ?? "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
