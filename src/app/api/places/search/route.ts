import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";

export const runtime = "nodejs";

type NominatimHit = {
  display_name?: string;
  lat?: string;
  lon?: string;
  name?: string;
  address?: {
    village?: string;
    town?: string;
    city?: string;
    suburb?: string;
    island?: string;
    state?: string;
    country?: string;
  };
};

function areaFrom(hit: NominatimHit) {
  const a = hit.address;
  if (!a) return null;
  return (
    a.village ||
    a.town ||
    a.suburb ||
    a.city ||
    a.island ||
    a.state ||
    null
  );
}

/** Look up a famous place / address for in-app Agent villa intake. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ places: [] });
  if (q.length > 200) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  if (!isDemoMode(request.headers.get("cookie"))) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const nominatim = new URL("https://nominatim.openstreetmap.org/search");
  nominatim.searchParams.set("q", q);
  nominatim.searchParams.set("format", "json");
  nominatim.searchParams.set("limit", "5");
  nominatim.searchParams.set("addressdetails", "1");

  let hits: NominatimHit[] = [];
  try {
    const res = await fetch(nominatim, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PulseFlow/1.0 (in-app property lookup)",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      hits = (await res.json()) as NominatimHit[];
    }
  } catch {
    hits = [];
  }

  const places = (Array.isArray(hits) ? hits : [])
    .filter((h) => h.lat && h.lon)
    .map((h) => ({
      label: h.name || h.display_name || q,
      area: areaFrom(h),
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lon}`,
    }));

  return NextResponse.json({ places });
}
