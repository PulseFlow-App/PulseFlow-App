import { allCategories, filterPros, sortOrganic } from "@/lib/pros/matching";
import type { ProProfile, ProsState } from "@/lib/pros/types";

const HINTS: Record<string, string[]> = {
  hvac: ["air conditioning", "air conditioner", "aircon", "air con", "hvac", "cooling", "แอร์", "кондиционер", "מזגן"],
  plumbing: ["plumbing", "leak", "leaking", "pipe", "toilet", "faucet", "drain", "clog", "ประปา", "сантех", "протеч", "אינסטל", "נזיל"],
  electrical: ["electrical", "electric", "socket", "breaker", "wiring", "ไฟฟ้า", "электрик", "חשמל"],
  handyman: ["handyman", "shelf", "hinge", "ช่างทั่วไป", "мастер на час", "הנדימן"],
  cleaning: ["cleaning", "clean the", "maid", "ทำความสะอาด", "уборк", "ניקיון"],
  "deep-cleaning": ["deep clean", "deep cleaning", "ทำความสะอาดลึก", "генеральн", "ניקיון יסודי"],
  pool: ["pool", "สระ", "бассейн", "בריכה"],
  gardening: ["garden", "gardening", "lawn", "hedge", "สวน", "сад", "גינון"],
  painting: ["paint", "painting", "ทาสี", "покраск", "צביעה"],
  carpentry: ["carpent", "woodwork", "ช่างไม้", "столяр", "נגר"],
  construction: ["renovat", "construction", "rebuild", "ก่อสร้าง", "รีโนเวท", "строитель", "שיפוץ"],
  appliance: ["appliance", "fridge", "refrigerator", "washing machine", "washer", "oven", "ตู้เย็น", "เครื่องซักผ้า", "холодильник", "מקרר"],
  pest: ["pest", "termite", "cockroach", "ant nest", "rodent", "mosquito", "แมลง", "ปลวก", "таракан", "הדברה"],
  water: ["water pump", "water tank", "water filter", "ปั๊มน้ำ", "ถังน้ำ", "насос", "משאבה"],
  it: ["internet", "wi-fi", "wifi", "router", "อินเทอร์เน็ต", "вайфай", "אינטרנט"],
  locksmith: ["locksmith", "lock", "key stuck", "กุญแจ", "замок", "מנעול"],
  waste: ["waste", "rubbish", "garbage", "trash", "ขยะ", "мусор", "אשפה"],
  moving: ["moving", "delivery", "relocat", "ขนย้าย", "переезд", "הובלה"],
  babysitting: ["babysit", "babysitter", "nanny", "childcare", "พี่เลี้ยง", "няня", "בייביסיטר"],
  "pet-sitting": ["pet sitter", "petsitter", "pet sitting", "dog", "cat", "walk the dog", "สัตว์เลี้ยง", "питом", "собак", "кошк", "כלב", "חתול", "חיות מחמד"],
};

export type BriefMatch = {
  categoryId: string;
  profile: ProProfile | null;
};

function hit(text: string, phrase: string) {
  const needle = phrase.toLowerCase().trim();
  if (needle.length < 3) return false;
  if (needle.length >= 5 || /[^\u0000-\u007f]/.test(needle)) return text.includes(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "u").test(text);
}

function scoreCategory(text: string, slug: string, names: string[]) {
  if (slug === "other") return 0;
  const phrases = [...(HINTS[slug] ?? []), ...names];
  let score = 0;
  for (const phrase of phrases) {
    if (hit(text, phrase)) score += phrase.trim().length;
  }
  if (slug === "hvac" && /(^|[^\p{L}\p{N}])ac([^\p{L}\p{N}]|$)/u.test(text)) score += 4;
  return score;
}

export function briefTitle(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 60) return clean;
  return `${clean.slice(0, 57)}…`;
}

/** Read a short job note and pick one profession, then one available professional in the selected area. */
export function suggestFromBrief(state: ProsState, raw: string): BriefMatch | null {
  const text = raw.toLowerCase().replace(/\s+/g, " ").trim();
  if (text.length < 12) return null;
  let best: { id: string; score: number } | null = null;
  for (const cat of allCategories(state)) {
    if (!cat.active) continue;
    const score = scoreCategory(text, cat.slug, Object.values(cat.names));
    if (!best || score > best.score) best = { id: cat.id, score };
  }
  if (!best || best.score <= 0) return null;
  const profile =
    sortOrganic(
      filterPros(state, {
        mode: "public",
        orgId: null,
        placeId: state.placeId,
        categoryId: best.id,
        available: true,
      }),
      state.reviews,
    )[0] ?? null;
  return { categoryId: best.id, profile };
}
