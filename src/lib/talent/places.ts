import type { MessageKey } from "@/lib/i18n";

/** Canonical English labels stored on profiles for consistent matching. */
export type TalentCountryDef = {
  id: string;
  /** English value written to `job_search_country`. */
  canonical: string;
  labelKey: MessageKey;
  aliases: string[];
};

export type TalentPlaceDef = {
  id: string;
  countryId: string;
  /** English value written to `job_search_location`. */
  canonical: string;
  labelKey: MessageKey;
  aliases: string[];
};

function norm(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const TALENT_COUNTRIES: TalentCountryDef[] = [
  {
    id: "thailand",
    canonical: "Thailand",
    labelKey: "talent.country.thailand",
    aliases: ["thailand", "ไทย", "ประเทศไทย", "תאילנד", "tailandia", "thailande"],
  },
  {
    id: "israel",
    canonical: "Israel",
    labelKey: "talent.country.israel",
    aliases: ["israel", "ישראל", "isr", "إسرائيل"],
  },
  {
    id: "indonesia",
    canonical: "Indonesia",
    labelKey: "talent.country.indonesia",
    aliases: ["indonesia", "อินโดนีเซีย", "אינדונזיה"],
  },
  {
    id: "uae",
    canonical: "United Arab Emirates",
    labelKey: "talent.country.uae",
    aliases: [
      "united arab emirates",
      "uae",
      "dubai",
      "abu dhabi",
      "איחוד האמירויות",
      "איחוד האמירויות הערביות",
    ],
  },
];

export const TALENT_PLACES: TalentPlaceDef[] = [
  {
    id: "phuket",
    countryId: "thailand",
    canonical: "Phuket",
    labelKey: "talent.place.phuket",
    aliases: ["phuket", "ภูเก็ต", "פוקט"],
  },
  {
    id: "koh_samui",
    countryId: "thailand",
    canonical: "Koh Samui",
    labelKey: "talent.place.koh_samui",
    aliases: [
      "koh samui",
      "ko samui",
      "samui",
      "เกาะสมุי",
      "เกาะสมุย",
      "קו סמוי",
      "סמוי",
    ],
  },
  {
    id: "koh_phangan",
    countryId: "thailand",
    canonical: "Koh Phangan",
    labelKey: "talent.place.koh_phangan",
    aliases: ["koh phangan", "ko phangan", "phangan", "เกาะพะงัน", "קו פנגן"],
  },
  {
    id: "bangkok",
    countryId: "thailand",
    canonical: "Bangkok",
    labelKey: "talent.place.bangkok",
    aliases: ["bangkok", "กรุงเทพ", "กรุงเทพมหานคร", "בנגקוק"],
  },
  {
    id: "chiang_mai",
    countryId: "thailand",
    canonical: "Chiang Mai",
    labelKey: "talent.place.chiang_mai",
    aliases: ["chiang mai", "เชียงใหม่", "צ'יאנג מאי", "צ׳יאנג מאי"],
  },
  {
    id: "pattaya",
    countryId: "thailand",
    canonical: "Pattaya",
    labelKey: "talent.place.pattaya",
    aliases: ["pattaya", "พัทยา", "פטאיה"],
  },
  {
    id: "krabi",
    countryId: "thailand",
    canonical: "Krabi",
    labelKey: "talent.place.krabi",
    aliases: ["krabi", "กระบี่", "קראבי"],
  },
  {
    id: "hua_hin",
    countryId: "thailand",
    canonical: "Hua Hin",
    labelKey: "talent.place.hua_hin",
    aliases: ["hua hin", "หัวหิน", "הואה הין"],
  },
  {
    id: "tel_aviv",
    countryId: "israel",
    canonical: "Tel Aviv",
    labelKey: "talent.place.tel_aviv",
    aliases: ["tel aviv", "tel-aviv", "תל אביב", "ת״א", 'ת"א'],
  },
  {
    id: "jerusalem",
    countryId: "israel",
    canonical: "Jerusalem",
    labelKey: "talent.place.jerusalem",
    aliases: ["jerusalem", "ירושלים"],
  },
  {
    id: "eilat",
    countryId: "israel",
    canonical: "Eilat",
    labelKey: "talent.place.eilat",
    aliases: ["eilat", "אילת"],
  },
  {
    id: "haifa",
    countryId: "israel",
    canonical: "Haifa",
    labelKey: "talent.place.haifa",
    aliases: ["haifa", "חיפה"],
  },
  {
    id: "bali",
    countryId: "indonesia",
    canonical: "Bali",
    labelKey: "talent.place.bali",
    aliases: ["bali", "บาหลี", "באלי"],
  },
  {
    id: "dubai",
    countryId: "uae",
    canonical: "Dubai",
    labelKey: "talent.place.dubai",
    aliases: ["dubai", "דובאי", "دبي"],
  },
];

export function findTalentCountry(filter: string | null | undefined) {
  const f = norm(filter ?? "");
  if (!f) return null;
  return (
    TALENT_COUNTRIES.find(
      (c) =>
        c.id === f ||
        norm(c.canonical) === f ||
        c.aliases.some((a) => norm(a) === f || f.includes(norm(a))),
    ) ?? null
  );
}

export function findTalentPlace(filter: string | null | undefined) {
  const f = norm(filter ?? "");
  if (!f) return null;
  return (
    TALENT_PLACES.find(
      (p) =>
        p.id === f ||
        norm(p.canonical) === f ||
        p.aliases.some((a) => norm(a) === f || f.includes(norm(a)) || norm(a).includes(f)),
    ) ?? null
  );
}

export function matchesTalentCountry(
  filter: string,
  storedCountry: string | null | undefined,
) {
  const f = norm(filter);
  if (!f) return true;
  const stored = norm(storedCountry ?? "");
  if (!stored) return false;
  const country = findTalentCountry(filter);
  if (country) {
    return (
      stored.includes(norm(country.canonical)) ||
      country.aliases.some((a) => stored.includes(norm(a)))
    );
  }
  return stored.includes(f);
}

export function matchesTalentPlace(
  filter: string,
  storedLocation: string | null | undefined,
  storedCountry: string | null | undefined = null,
) {
  const f = norm(filter);
  if (!f) return true;
  const hay = norm(`${storedLocation ?? ""} ${storedCountry ?? ""}`);
  if (!hay.trim()) return false;
  const place = findTalentPlace(filter);
  if (place) {
    return (
      hay.includes(norm(place.canonical)) ||
      place.aliases.some((a) => hay.includes(norm(a)))
    );
  }
  return hay.includes(f);
}

export function placesForCountry(countryFilter: string | null | undefined) {
  const country = findTalentCountry(countryFilter ?? "");
  if (!country) return TALENT_PLACES;
  return TALENT_PLACES.filter((p) => p.countryId === country.id);
}

export function countryLabelKey(canonicalOrId: string): MessageKey | null {
  return findTalentCountry(canonicalOrId)?.labelKey ?? null;
}

export function placeLabelKey(canonicalOrId: string): MessageKey | null {
  return findTalentPlace(canonicalOrId)?.labelKey ?? null;
}
