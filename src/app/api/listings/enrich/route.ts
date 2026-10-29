import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import {
  enrichFromHtml,
  enrichFromPlainText,
} from "@/lib/villas/enrich-from-source";
import { safeFetchText } from "@/lib/security/safe-fetch";
import {
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/**
 * Best-effort listing enrichment from a public URL or pasted text.
 * Uses Open Graph / title / description - not a full SPA scrape.
 */
export async function POST(request: Request) {
  const rl = rateLimit(`enrich:${clientIp(request)}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  if (!isDemoMode(request.headers.get("cookie"))) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: { url?: string; text?: string };
  try {
    body = (await request.json()) as { url?: string; text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body.text?.trim() ?? "";
  const url = body.url?.trim() ?? "";

  if (text && !url) {
    return NextResponse.json({ enrichment: enrichFromPlainText(text) });
  }

  if (!url) {
    return NextResponse.json({ error: "url or text required" }, { status: 400 });
  }

  try {
    const fetched = await safeFetchText(url, {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeoutMs: 15_000,
      maxBytes: 400_000,
    });
    const html = fetched.text;
    const enrichment = enrichFromHtml(html.slice(0, 400_000), fetched.url);
    const head = html.slice(0, 2500);
    const botWall =
      /page not found|access denied|captcha|cf-browser-verification|just a moment|challenge-platform|awsWafCookieDomainList|challenge\.js|reportChallengeError/i.test(
        head,
      );
    const hasListingPreview =
      Boolean(enrichment.name || enrichment.bedrooms != null) &&
      !botWall;
    // Booking / similar: AWS WAF challenge (~4kb shell). Airbnb preview: OG only.
    const thin =
      botWall ||
      (fetched.status >= 400 && !hasListingPreview) ||
      (html.length < 2500 && !hasListingPreview);

    if (text) {
      const fromPaste = enrichFromPlainText(text);
      enrichment.amenities_found = [
        ...new Set([
          ...(enrichment.amenities_found ?? []),
          ...(fromPaste.amenities_found ?? []),
        ]),
      ];
      if (!enrichment.name && fromPaste.name) enrichment.name = fromPaste.name;
      if (!enrichment.area && fromPaste.area) enrichment.area = fromPaste.area;
      if (!enrichment.description && fromPaste.description) {
        enrichment.description = fromPaste.description;
      }
      if (enrichment.bedrooms == null && fromPaste.bedrooms != null) {
        enrichment.bedrooms = fromPaste.bedrooms;
      }
      if (enrichment.bathrooms == null && fromPaste.bathrooms != null) {
        enrichment.bathrooms = fromPaste.bathrooms;
      }
      if (enrichment.max_guests == null && fromPaste.max_guests != null) {
        enrichment.max_guests = fromPaste.max_guests;
      }
      if (enrichment.sq_m == null && fromPaste.sq_m != null) {
        enrichment.sq_m = fromPaste.sq_m;
      }
      if (enrichment.has_pool == null && fromPaste.has_pool != null) {
        enrichment.has_pool = fromPaste.has_pool;
      }
      if (enrichment.has_wifi == null && fromPaste.has_wifi != null) {
        enrichment.has_wifi = fromPaste.has_wifi;
      }
      if (enrichment.has_garden == null && fromPaste.has_garden != null) {
        enrichment.has_garden = fromPaste.has_garden;
      }
      if (enrichment.pet_friendly == null && fromPaste.pet_friendly != null) {
        enrichment.pet_friendly = fromPaste.pet_friendly;
      }
      if (!enrichment.property_type && fromPaste.property_type) {
        enrichment.property_type = fromPaste.property_type;
      }
      if (!enrichment.kitchen && fromPaste.kitchen) {
        enrichment.kitchen = fromPaste.kitchen;
      }
      if (!enrichment.parking && fromPaste.parking) {
        enrichment.parking = fromPaste.parking;
      }
      if (!enrichment.aircon && fromPaste.aircon) {
        enrichment.aircon = fromPaste.aircon;
      }
      if (!enrichment.view && fromPaste.view) enrichment.view = fromPaste.view;
    }

    return NextResponse.json({
      enrichment,
      fetched: fetched.status < 400 && !thin,
      warning: thin
        ? "Listing from this page can't be read at the moment"
        : null,
    });
  } catch {
    const fallback = text ? enrichFromPlainText(text) : {};
    return NextResponse.json({
      enrichment: fallback,
      fetched: false,
      warning: "Listing from this page can't be read at the moment",
    });
  }
}
