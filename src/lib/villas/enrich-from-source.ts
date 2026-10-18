/** Parse listing text / HTML snippets into villa draft fields. */

import type {
  PropertyType,
  VillaAircon,
  VillaKitchen,
  VillaParking,
  VillaView,
} from "@/lib/types";

export type VillaEnrichment = {
  name?: string;
  area?: string;
  description?: string;
  location_url?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  max_guests?: number | null;
  sq_m?: number | null;
  has_pool?: boolean | null;
  has_wifi?: boolean | null;
  has_garden?: boolean | null;
  pet_friendly?: boolean | null;
  property_type?: PropertyType | null;
  kitchen?: VillaKitchen | null;
  parking?: VillaParking | null;
  aircon?: VillaAircon | null;
  view?: VillaView | null;
  /** Human-readable amenity hits for description / review. */
  amenities_found?: string[];
};

function numMatch(text: string, re: RegExp): number | null {
  const m = text.match(re);
  if (!m?.[1]) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\\u0026/g, "&")
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Airbnb / Booking style: "8 guests · 4 bedrooms · 4 beds · 3 baths" */
function parseListingStats(text: string): Partial<VillaEnrichment> {
  const out: Partial<VillaEnrichment> = {};
  const guests =
    numMatch(text, /(\d+)\s*guests?/i) ??
    numMatch(text, /(?:sleeps?|occupancy|עד)\s*(\d+)/i);
  if (guests != null) out.max_guests = guests;

  const bedrooms =
    numMatch(text, /(\d+(?:\.\d+)?)\s*bedrooms?/i) ??
    numMatch(text, /(\d+)\s*BR\b/i) ??
    numMatch(text, /(\d+(?:\.\d+)?)\s*(?:beds?|br\b|חדרי?\s*שינה)/i);
  if (bedrooms != null) out.bedrooms = bedrooms;

  const bathrooms =
    numMatch(text, /(\d+(?:\.\d+)?)\s*bath(?:room)?s?/i) ??
    numMatch(text, /(\d+(?:\.\d+)?)\s*BA\b/i);
  if (bathrooms != null) out.bathrooms = bathrooms;

  const sqm =
    numMatch(text, /(\d+(?:\.\d+)?)\s*(?:m²|m2|sq\.?\s*m|sqm|מ״ר|מ"ר)/i) ??
    numMatch(text, /(\d+(?:\.\d+)?)\s*(?:square\s*meters?)/i);
  if (sqm != null) out.sq_m = sqm;

  return out;
}

function detectPropertyType(text: string): PropertyType | null {
  const lower = text.toLowerCase();
  if (/\bentire\s+villa\b|\bvilla\b/.test(lower)) return "villa";
  if (/\bbungalow\b/.test(lower)) return "bungalow";
  if (/\bentire\s+home\b|\bhouse\b/.test(lower)) return "house";
  if (/\bapartment\b|\bflat\b|\bcondo\b/.test(lower)) return "apartment";
  if (/\bstudio\b/.test(lower)) return "studio";
  if (/\boffice\b/.test(lower)) return "office";
  return null;
}

type AmenityHit = {
  label: string;
  patch: Partial<VillaEnrichment>;
};

const AMENITY_RULES: { re: RegExp; hit: AmenityHit }[] = [
  {
    re: /\b(private\s+)?pool\b|בריכה|swimming\s*pool/i,
    hit: { label: "Pool", patch: { has_pool: true } },
  },
  {
    re: /\bwifi\b|\bwi-?fi\b|\bwlan\b|wireless\s*internet|וויי.?פיי/i,
    hit: { label: "Wifi", patch: { has_wifi: true } },
  },
  {
    re: /\bgarden\b|\byard\b|גינה|backyard/i,
    hit: { label: "Garden", patch: { has_garden: true } },
  },
  {
    re: /\bpet[s]?\s*friendly\b|\bpets?\s*allowed\b|allows\s*pets|ידידותי\s*לחיות/i,
    hit: { label: "Pet friendly", patch: { pet_friendly: true } },
  },
  {
    re: /\bfull\s*kitchen\b|\bkitchen\b(?!\s*ette)/i,
    hit: { label: "Kitchen", patch: { kitchen: "full" } },
  },
  {
    re: /\bkitchenette\b|\bbasic\s*kitchen\b/i,
    hit: { label: "Kitchenette", patch: { kitchen: "basic" } },
  },
  {
    // Airbnb often labels this simply "Parking" / free_parking / garage.
    re: /\bfree\s*parking\b|\bprivate\s*parking\b|\bparking\s*on\s*premises\b|\bfree_parking\b|\bparking\b|\bgarage\b|\bcarport\b|\bdriveway\b/i,
    hit: { label: "Parking", patch: { parking: "private" } },
  },
  {
    re: /\bstreet\s*parking\b|\bpaid\s*parking\b|\bpaid_parking\b/i,
    hit: { label: "Street parking", patch: { parking: "street" } },
  },
  {
    re: /\bcentral\s*air\b|\bair\s*conditioning\b|\bair_conditioning\b|\ba\/?c\b|\baircon\b/i,
    hit: { label: "Air conditioning", patch: { aircon: "full" } },
  },
  {
    re: /\bsea\s*view\b|\bocean\s*view\b/i,
    hit: { label: "Sea view", patch: { view: "sea" } },
  },
  {
    re: /\bjungle\s*view\b|\bforest\s*view\b/i,
    hit: { label: "Jungle view", patch: { view: "jungle" } },
  },
  {
    re: /\bpool\s*view\b/i,
    hit: { label: "Pool view", patch: { view: "pool" } },
  },
  {
    re: /\bgarden\s*view\b/i,
    hit: { label: "Garden view", patch: { view: "garden" } },
  },
  {
    re: /\bmountain\s*view\b/i,
    hit: { label: "Mountain view", patch: { view: "mountain" } },
  },
];

/**
 * Common Airbnb amenity numeric IDs that appear in listing JSON.
 * (Publicly observed; not a full catalog.)
 */
const AIRBNB_AMENITY_IDS: Record<number, AmenityHit> = {
  4: { label: "Wifi", patch: { has_wifi: true } },
  5: { label: "Air conditioning", patch: { aircon: "full" } },
  7: { label: "Kitchen", patch: { kitchen: "full" } },
  8: { label: "Parking", patch: { parking: "private" } },
  9: { label: "Street parking", patch: { parking: "street" } },
  15: { label: "Parking", patch: { parking: "private" } },
  25: { label: "Pool", patch: { has_pool: true } },
  27: { label: "Parking", patch: { parking: "private" } },
  30: { label: "Heating", patch: {} },
  33: { label: "Washer", patch: {} },
  34: { label: "Dryer", patch: {} },
  45: { label: "Wifi", patch: { has_wifi: true } },
  47: { label: "Parking", patch: { parking: "private" } },
  51: { label: "Pool", patch: { has_pool: true } },
  99: { label: "Beach", patch: { view: "sea" } },
  236: { label: "Pet friendly", patch: { pet_friendly: true } },
  308: { label: "Parking", patch: { parking: "private" } },
  670: { label: "Parking", patch: { parking: "private" } },
};

function detectAirbnbAmenityIds(html: string): Partial<VillaEnrichment> {
  const out: Partial<VillaEnrichment> = {};
  const found: string[] = [];
  const idSets = html.matchAll(
    /"amenity(?:Ids|ids)?"\s*:\s*\[([0-9,\s]{1,800})\]/g,
  );
  for (const match of idSets) {
    const nums = (match[1] ?? "").match(/\d+/g) ?? [];
    for (const raw of nums) {
      const id = Number(raw);
      const hit = AIRBNB_AMENITY_IDS[id];
      if (!hit) continue;
      found.push(hit.label);
      Object.assign(out, hit.patch);
    }
  }
  // Also: "id":8,"available":true near amenity objects
  const objectIds = html.matchAll(
    /"id"\s*:\s*(\d{1,4})\s*,\s*"(?:available|isPresent)"\s*:\s*true/gi,
  );
  for (const match of objectIds) {
    const id = Number(match[1]);
    const hit = AIRBNB_AMENITY_IDS[id];
    if (!hit) continue;
    found.push(hit.label);
    Object.assign(out, hit.patch);
  }
  if (found.length) out.amenities_found = [...new Set(found)];
  return out;
}

function detectAmenities(text: string): Partial<VillaEnrichment> {
  const out: Partial<VillaEnrichment> = {};
  const found: string[] = [];
  for (const { re, hit } of AMENITY_RULES) {
    if (!re.test(text)) continue;
    found.push(hit.label);
    Object.assign(out, hit.patch);
  }
  if (found.length) out.amenities_found = [...new Set(found)];
  return out;
}

function mergeEnrichment(
  base: VillaEnrichment,
  extra: Partial<VillaEnrichment>,
): VillaEnrichment {
  const amenities = [
    ...(base.amenities_found ?? []),
    ...(extra.amenities_found ?? []),
  ];
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(extra).filter(([, v]) => v != null && v !== ""),
    ),
    amenities_found: amenities.length ? [...new Set(amenities)] : undefined,
  };
}

const MARKETING_RE =
  /\b(stunning|beautiful|amazing|gorgeous|breathtaking|luxury|luxurious|paradise|dream(?:y)?|unforgettable|perfect|ideal|cozy|charming|incredible|wonderful|delightful|spectacular|fabulous|exquisite|magnificent|romantic|magical|must[- ]see|instagram(?:mable)?|oasis|nestled|heart of|you'll love|you will love|book now|don't miss|unique opportunity|once in a lifetime|escape to|welcome to|discover|indulge|serene|tranquil gem|hidden gem|best[- ]in[- ]class)\b/i;

function stripMarketing(s: string): string {
  return s
    .replace(new RegExp(MARKETING_RE.source, "gi"), "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
}

/** Pull a short place name from listing copy (not marketing). */
function extractAreaHint(text: string): string | null {
  const patterns = [
    /\b(?:in|near|at)\s+([A-Z][\w'’.-]+(?:\s+[A-Z][\w'’.-]+){0,3})\b/,
    /\b(?:located in|close to|walking distance to|minutes? from)\s+([A-Za-z][\w'’.\s-]{2,40}?)(?:\.|,|$)/i,
    /\b(Koh\s+[A-Za-z]+|Phangan|Samui|Pangan|Srithanu|Haad\s+\w+|Thong\s+\w+)\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    const hit = m?.[1]?.trim();
    if (!hit || hit.length > 42) continue;
    if (MARKETING_RE.test(hit)) continue;
    if (/^(The|This|Our|A|An)\b/i.test(hit)) continue;
    return hit.replace(/\s+/g, " ");
  }
  return null;
}

function extractSettingFacts(text: string): string[] {
  const lower = text.toLowerCase();
  const facts: string[] = [];
  if (/\bhillside\b|\bon a hill\b/.test(lower)) facts.push("hillside");
  if (/\bbeachfront\b|\bon the beach\b/.test(lower)) facts.push("beachfront");
  if (/\bquiet\s+(?:lane|street|area|neighbourhood|neighborhood)\b/.test(lower)) {
    facts.push("quiet lane");
  }
  const walk = text.match(
    /(\d+)\s*(?:min(?:ute)?s?|mins?)\s*(?:walk|drive|by\s*scooter)?\s*(?:to|from)\s+([A-Za-z][\w\s'-]{2,30})/i,
  );
  if (walk) {
    facts.push(
      `${walk[1]} min ${/drive/i.test(walk[0]) ? "drive" : "walk"} to ${walk[2]!.trim()}`,
    );
  }
  const floors = numMatch(lower, /(\d+)\s*(?:floors?|storeys?|stories)\b/);
  if (floors != null && floors >= 2) facts.push(`${floors} floors`);
  return facts;
}

/**
 * Ops card blurb — same spirit as demo villas:
 * "Sea-view 2BR with private pool near Srithanu."
 * Facts only; never paste listing marketing copy.
 */
export function buildOpsDescription(
  sourceText: string,
  facts: Partial<VillaEnrichment>,
): string {
  const text = sourceText.replace(/\s+/g, " ").trim();
  const area = facts.area?.trim() || extractAreaHint(text) || "";
  const type = facts.property_type || detectPropertyType(text) || "property";
  const beds = facts.bedrooms;
  const baths = facts.bathrooms;
  const guests = facts.max_guests;
  const sqm = facts.sq_m;

  const viewBit =
    facts.view === "sea"
      ? "Sea-view "
      : facts.view === "jungle"
        ? "Jungle-view "
        : facts.view === "mountain"
          ? "Mountain-view "
          : facts.view === "pool"
            ? "Pool-view "
            : facts.view === "garden"
              ? "Garden-view "
              : "";

  const brBit =
    beds != null
      ? `${Number.isInteger(beds) ? beds : beds}BR `
      : "";

  const featureBits: string[] = [];
  if (facts.has_pool) featureBits.push("private pool");
  if (facts.has_garden) featureBits.push("garden");
  if (facts.parking === "private" || facts.parking === "street") {
    featureBits.push(
      facts.parking === "street" ? "street parking" : "parking",
    );
  }
  if (facts.kitchen === "full" || facts.kitchen === "basic") {
    featureBits.push(facts.kitchen === "basic" ? "kitchenette" : "kitchen");
  }
  if (facts.aircon) featureBits.push("AC");
  if (facts.has_wifi) featureBits.push("wifi");
  if (facts.pet_friendly) featureBits.push("pet friendly");

  // Prefer 1–2 standout features in the opening (pool/garden), rest later.
  const openerFeatures = featureBits.filter((f) =>
    /pool|garden|parking/.test(f),
  );
  const restFeatures = featureBits.filter((f) => !/pool|garden|parking/.test(f));

  let opener = `${viewBit}${brBit}${type}`.replace(/\s+/g, " ").trim();
  if (openerFeatures.length) {
    opener += ` with ${openerFeatures.slice(0, 2).join(" and ")}`;
  }
  if (area) opener += ` near ${area}`;
  opener = opener.charAt(0).toUpperCase() + opener.slice(1);
  if (!opener.endsWith(".")) opener += ".";

  const line2: string[] = [];
  if (guests != null) line2.push(`Sleeps ${guests}`);
  if (baths != null) line2.push(`${baths} bath${baths === 1 ? "" : "s"}`);
  if (sqm != null) line2.push(`~${sqm} m²`);
  line2.push(...extractSettingFacts(text).slice(0, 2));
  if (restFeatures.length) line2.push(restFeatures.join(", "));

  const second =
    line2.length > 0
      ? line2
          .join(". ")
          .replace(/\.\./g, ".")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\.?$/, ".")
      : "";

  // One cleaned factual sentence from source if it adds layout/location
  // without marketing — never dump the full listing.
  let extra = "";
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 24 && s.length <= 140);
  for (const s of sentences) {
    if (MARKETING_RE.test(s)) continue;
    if (
      !/\b(bedroom|bathroom|floor|pool|garden|kitchen|parking|beach|hill|sq\.?\s*m|m²|guest|villa|house|bungalow|apartment)\b/i.test(
        s,
      )
    ) {
      continue;
    }
    // Skip pure amenity list / guest count lines already covered
    if (/^\d+\s*guests?/i.test(s)) continue;
    const cleaned = stripMarketing(s);
    if (cleaned.length < 20) continue;
    if (opener.toLowerCase().includes(cleaned.toLowerCase().slice(0, 24))) {
      continue;
    }
    extra = cleaned.endsWith(".") ? cleaned : `${cleaned}.`;
    break;
  }

  return [opener, second, extra].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function finalizeEnrichment(
  out: VillaEnrichment,
  sourceText: string,
): VillaEnrichment {
  if (!out.area) {
    const area = extractAreaHint(sourceText);
    if (area) out.area = area;
  }
  out.description = buildOpsDescription(sourceText, out);
  return out;
}

export function enrichFromPlainText(text: string): VillaEnrichment {
  const raw = text.trim();
  if (!raw) return {};
  let out: VillaEnrichment = { ...parseListingStats(raw) };

  const bedrooms =
    out.bedrooms ??
    numMatch(raw, /(\d+(?:\.\d+)?)\s*(?:bedrooms?|beds?|br\b|חדרי?\s*שינה)/i);
  if (bedrooms != null) out.bedrooms = bedrooms;

  const bathrooms =
    out.bathrooms ??
    numMatch(raw, /(\d+(?:\.\d+)?)\s*(?:bathrooms?|baths?|ba\b)/i);
  if (bathrooms != null) out.bathrooms = bathrooms;

  out = mergeEnrichment(out, detectAmenities(raw));
  const pType = detectPropertyType(raw);
  if (pType) out.property_type = pType;

  const firstLine = raw.split(/\n/).map((l) => l.trim()).find(Boolean);
  // Don't treat a long marketing paragraph as the property name.
  if (
    firstLine &&
    firstLine.length <= 60 &&
    !/^https?:/i.test(firstLine) &&
    !MARKETING_RE.test(firstLine) &&
    !/\bguests?\b|\bbedrooms?\b|\bbaths?\b/i.test(firstLine)
  ) {
    out.name = firstLine.replace(/^["']|["']$/g, "");
  }

  return finalizeEnrichment(out, raw);
}

function pickMeta(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    "i",
  );
  return html.match(re)?.[1] ?? html.match(re2)?.[1] ?? null;
}

function extractJsonLdBlocks(html: string): string[] {
  const blocks: string[] = [];
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) != null) {
    if (m[1]) blocks.push(m[1]);
  }
  return blocks;
}

/** Pull amenity / listing phrases from Airbnb-style embedded JSON. */
function extractEmbeddedListingText(html: string): string {
  const chunks: string[] = [];

  for (const block of extractJsonLdBlocks(html)) {
    chunks.push(block);
    try {
      const data = JSON.parse(block) as unknown;
      const walk = (node: unknown, depth: number) => {
        if (depth > 8 || node == null) return;
        if (typeof node === "string") {
          if (node.length > 2 && node.length < 400) chunks.push(node);
          return;
        }
        if (Array.isArray(node)) {
          for (const item of node.slice(0, 80)) walk(item, depth + 1);
          return;
        }
        if (typeof node === "object") {
          for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
            if (
              /name|description|amenit|title|address|locality|guest|bedroom|bathroom|property/i.test(
                k,
              )
            ) {
              walk(v, depth + 1);
            }
          }
        }
      };
      walk(data, 0);
    } catch {
      /* ignore bad JSON-LD */
    }
  }

  // Airbnb / Booking often stash amenity titles in escaped JSON blobs.
  const titleHits = html.matchAll(
    /"(?:title|name|accessibilityLabel)"\s*:\s*"([^"]{2,80})"/g,
  );
  for (const hit of titleHits) {
    const v = hit[1];
    if (
      v &&
      /wifi|pool|kitchen|parking|garden|pet|air|view|beach|washer|dryer|hot tub|bbq|grill/i.test(
        v,
      )
    ) {
      chunks.push(v);
    }
  }

  const amenityKeyHits = html.matchAll(
    /"amenity(?:Key|Id|Title)?"\s*:\s*"([^"]+)"/gi,
  );
  for (const hit of amenityKeyHits) {
    if (hit[1]) chunks.push(hit[1].replace(/_/g, " "));
  }

  return chunks.join("\n");
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

export function enrichFromHtml(html: string, pageUrl?: string): VillaEnrichment {
  const title =
    pickMeta(html, "og:title") ||
    pickMeta(html, "twitter:title") ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
    null;
  const description =
    pickMeta(html, "og:description") ||
    pickMeta(html, "description") ||
    pickMeta(html, "twitter:description") ||
    null;

  const metaText = [title, description].filter(Boolean).join("\n\n");
  let out: VillaEnrichment = enrichFromPlainText(metaText);

  // Critical: also scan page body + embedded JSON for amenities (OG alone is thin).
  const bodyText = stripTags(html).slice(0, 60_000);
  const embedded = extractEmbeddedListingText(html).slice(0, 40_000);
  const scanText = `${metaText}\n${embedded}\n${bodyText}`;

  out = mergeEnrichment(out, parseListingStats(scanText));
  out = mergeEnrichment(out, detectAmenities(scanText));
  out = mergeEnrichment(out, detectAirbnbAmenityIds(html));
  const pType = detectPropertyType(scanText);
  if (pType) out.property_type = pType;

  if (title) {
    const cleanedName = decodeHtml(title)
      .replace(/\s*[|\-–].*$/, "")
      .trim();
    if (cleanedName && !MARKETING_RE.test(cleanedName)) {
      out.name = cleanedName || out.name;
    }
  }
  if (description) {
    out = mergeEnrichment(out, parseListingStats(decodeHtml(description)));
  }

  const areaGuess =
    title?.match(/,\s*([^,|]+)\s*[|\-–]/)?.[1]?.trim() ||
    description?.match(/\bin\s+([A-Z][\w\s]{2,40})\b/)?.[1] ||
    html.match(/"city"\s*:\s*"([^"]+)"/)?.[1] ||
    html.match(/"localizedCityName"\s*:\s*"([^"]+)"/)?.[1];
  if (areaGuess && areaGuess.length < 48) out.area = decodeHtml(areaGuess);

  if (pageUrl && /airbnb\.|booking\.com|vrbo\.|expedia\./i.test(pageUrl)) {
    void pageUrl;
  }

  // Rewrite into short ops blurb — never paste listing marketing as description.
  return finalizeEnrichment(out, scanText.slice(0, 8000));
}
