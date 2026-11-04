import { DEMO_CLEANER_ID, DEMO_ORG_ID, DEMO_OWNER_ID } from "@/lib/demo/seed-data";
import { LOCALES, isLocale } from "@/lib/i18n";
import type { ProProfile, ProsLang, ProsState } from "@/lib/pros/types";

export const PROS_LANGS: ProsLang[] = [...LOCALES];

/** English required; other Pulse Flow locales optional (fall back to en). */
type Names = { en: string } & Partial<Record<ProsLang, string>>;

export type CatalogCategory = {
  id: string;
  slug: string;
  icon: string;
  names: Names;
  descriptions: Names;
};

export type CatalogArea = {
  id: string;
  slug: string;
  parentId: string | null;
  level: "country" | "region" | "locality" | "district";
  countryCode: string;
  demoMarket: boolean;
  names: Names;
};

const n = (en: string, th: string, ru: string, he: string): Names => ({ en, th, ru, he });

/** Merge extra locale labels onto catalog names (fr/de/es/it/tr/ar/my, …). */
export function withLocaleNames(
  base: Names,
  extra: Partial<Record<ProsLang, string>>,
): Names {
  return { ...base, ...extra };
}

export const CATEGORIES: CatalogCategory[] = [
  { id: "c2000001-0000-4000-8000-000000000001", slug: "hvac", icon: "wind", names: n("Air conditioning and HVAC", "แอร์และระบบปรับอากาศ", "Кондиционеры и HVAC", "מיזוג אוויר"), descriptions: n("Cooling, servicing, and repair", "ติดตั้ง ล้าง และซ่อม", "Обслуживание и ремонт", "התקנה, טיפול ותיקון") },
  { id: "c2000001-0000-4000-8000-000000000002", slug: "plumbing", icon: "droplets", names: n("Plumbing", "ประปา", "Сантехника", "אינסטלציה"), descriptions: n("Leaks, pipes, and fixtures", "รั่ว ท่อ และอุปกรณ์", "Протечки и трубы", "נזילות וצנרת") },
  { id: "c2000001-0000-4000-8000-000000000003", slug: "electrical", icon: "zap", names: n("Electrical", "ไฟฟ้า", "Электрика", "חשמל"), descriptions: n("Power, lights, and safety", "ไฟและปลั๊ก", "Свет и розетки", "תאורה ושקעים") },
  { id: "c2000001-0000-4000-8000-000000000004", slug: "handyman", icon: "wrench", names: n("Handyman", "ช่างทั่วไป", "Мастер на час", "הנדימן"), descriptions: n("Small fixes around the property", "งานซ่อมเล็กน้อย", "Мелкий ремонт", "תיקונים קטנים") },
  { id: "c2000001-0000-4000-8000-000000000005", slug: "cleaning", icon: "sparkles", names: n("Cleaning", "ทำความสะอาด", "Уборка", "ניקיון"), descriptions: n("Regular cleaning", "ทำความสะอาดตามรอบ", "Регулярная уборка", "ניקיון שוטף") },
  { id: "c2000001-0000-4000-8000-000000000006", slug: "deep-cleaning", icon: "sparkles", names: n("Deep cleaning", "ทำความสะอาดลึก", "Генеральная уборка", "ניקיון יסודי"), descriptions: n("A full clean", "ทำความสะอาดทั้งหลัง", "Полная уборка", "ניקיון מלא") },
  { id: "c2000001-0000-4000-8000-000000000007", slug: "pool", icon: "waves", names: n("Pool", "สระว่ายน้ำ", "Бассейн", "בריכה"), descriptions: n("Pool care", "ดูแลสระ", "Уход за бассейном", "טיפול בבריכה") },
  { id: "c2000001-0000-4000-8000-000000000008", slug: "gardening", icon: "trees", names: n("Gardening", "สวน", "Сад", "גינון"), descriptions: n("Garden and grounds", "ดูแลสวน", "Участок и растения", "גינה ושטח") },
  { id: "c2000001-0000-4000-8000-000000000009", slug: "painting", icon: "paintbrush", names: n("Painting", "ทาสี", "Покраска", "צביעה"), descriptions: n("Interior and exterior", "ภายในและภายนอก", "Внутри и снаружи", "פנים וחוץ") },
  { id: "c2000001-0000-4000-8000-000000000010", slug: "carpentry", icon: "hammer", names: n("Carpentry", "ช่างไม้", "Столярка", "נגרות"), descriptions: n("Woodwork and doors", "งานไม้", "Дерево и двери", "עץ ודלתות") },
  { id: "c2000001-0000-4000-8000-000000000011", slug: "construction", icon: "hard-hat", names: n("Construction and renovation", "ก่อสร้างและรีโนเวท", "Строительство и ремонт", "בנייה ושיפוץ"), descriptions: n("Building and refit", "งานสร้างและปรับปรุง", "Стройка и переделка", "בנייה ושיפוץ") },
  { id: "c2000001-0000-4000-8000-000000000012", slug: "appliance", icon: "refrigerator", names: n("Appliance repair", "ซ่อมเครื่องใช้ไฟฟ้า", "Ремонт техники", "תיקון מכשירי חשמל"), descriptions: n("Home appliances", "เครื่องใช้ในบ้าน", "Бытовая техника", "מכשירי בית") },
  { id: "c2000001-0000-4000-8000-000000000013", slug: "pest", icon: "bug", names: n("Pest control", "กำจัดแมลง", "Дезинсекция", "הדברה"), descriptions: n("Insects and rodents", "แมลงและหนู", "Насекомые и грызуны", "חרקים ומכרסמים") },
  { id: "c2000001-0000-4000-8000-000000000014", slug: "water", icon: "glass-water", names: n("Water systems", "ระบบน้ำ", "Водоснабжение", "מערכות מים"), descriptions: n("Pumps, tanks, and filters", "ปั๊มและถัง", "Насосы и фильтры", "משאבות ומכלים") },
  { id: "c2000001-0000-4000-8000-000000000015", slug: "it", icon: "wifi", names: n("Internet and IT", "อินเทอร์เน็ตและไอที", "Интернет и IT", "אינטרנט ומחשוב"), descriptions: n("Wi-Fi and networks", "ไวไฟ", "Wi-Fi и сети", "רשת אלחוטית") },
  { id: "c2000001-0000-4000-8000-000000000016", slug: "locksmith", icon: "key", names: n("Locksmith", "ช่างกุญแจ", "Слесарь", "מנעולן"), descriptions: n("Locks and keys", "กุญแจ", "Замки и ключи", "מנעולים ומפתחות") },
  { id: "c2000001-0000-4000-8000-000000000017", slug: "waste", icon: "trash", names: n("Waste collection", "เก็บขยะ", "Вывоз мусора", "פינוי פסולת"), descriptions: n("Rubbish and haul-away", "ขนขยะ", "Мусор и вывоз", "אשפה ופינוי") },
  { id: "c2000001-0000-4000-8000-000000000018", slug: "moving", icon: "truck", names: n("Moving and delivery", "ขนย้ายและส่งของ", "Переезд и доставка", "הובלה ומשלוחים"), descriptions: n("Moving things locally", "ย้ายของในพื้นที่", "Местные перевозки", "הובלה מקומית") },
  { id: "c2000001-0000-4000-8000-000000000020", slug: "babysitting", icon: "users", names: n("Babysitters", "พี่เลี้ยงเด็ก", "Няни", "בייביסיטר"), descriptions: n("Childcare at the property", "ดูแลเด็กที่บ้าน", "Присмотр за детьми", "שמירה על ילדים") },
  { id: "c2000001-0000-4000-8000-000000000021", slug: "pet-sitting", icon: "home", names: n("Pet sitter", "พี่เลี้ยงสัตว์เลี้ยง", "Присмотр за питомцами", "שמירה על חיות מחמד"), descriptions: n("Care for pets at the property", "ดูแลสัตว์เลี้ยงที่บ้าน", "Присмотр за питомцами на объекте", "שמירה על חיות מחמד בנכס") },
  { id: "c2000001-0000-4000-8000-000000000019", slug: "other", icon: "dot", names: n("Other", "อื่นๆ", "Другое", "אחר"), descriptions: n("A profession that is not listed yet", "อาชีพที่ยังไม่มีหมวด", "Профессия вне списка", "מקצוע שעוד לא ברשימה") },
];

export const AREAS: CatalogArea[] = [
  { id: "a2000001-0000-4000-8000-000000000001", slug: "th", parentId: null, level: "country", countryCode: "TH", demoMarket: false, names: n("Thailand", "ประเทศไทย", "Таиланд", "תאילנד") },
  { id: "a2000001-0000-4000-8000-000000000002", slug: "th-surat", parentId: "a2000001-0000-4000-8000-000000000001", level: "region", countryCode: "TH", demoMarket: false, names: n("Surat Thani", "สุราษฎร์ธานี", "Сураттхани", "סוראט תאני") },
  { id: "a2000001-0000-4000-8000-000000000003", slug: "th-phangan", parentId: "a2000001-0000-4000-8000-000000000002", level: "locality", countryCode: "TH", demoMarket: true, names: n("Koh Phangan", "เกาะพะงัน", "Панган", "קו פנגן") },
  { id: "a2000001-0000-4000-8000-000000000004", slug: "thong-sala", parentId: "a2000001-0000-4000-8000-000000000003", level: "district", countryCode: "TH", demoMarket: false, names: n("Thong Sala", "ท้องศาลา", "Тонг Сала", "תונג סאלה") },
  { id: "a2000001-0000-4000-8000-000000000005", slug: "haad-rin", parentId: "a2000001-0000-4000-8000-000000000003", level: "district", countryCode: "TH", demoMarket: false, names: n("Haad Rin", "หาดริ้น", "Хад Рин", "האד רין") },
  { id: "a2000001-0000-4000-8000-000000000006", slug: "baan-tai", parentId: "a2000001-0000-4000-8000-000000000003", level: "district", countryCode: "TH", demoMarket: false, names: n("Baan Tai", "บ้านใต้", "Бан Тай", "באן טאי") },
  { id: "a2000001-0000-4000-8000-000000000007", slug: "chaloklum", parentId: "a2000001-0000-4000-8000-000000000003", level: "district", countryCode: "TH", demoMarket: false, names: n("Chaloklum", "โฉลกหลำ", "Чалоклум", "צ׳אלוקלום") },
  { id: "a2000001-0000-4000-8000-000000000008", slug: "hin-kong", parentId: "a2000001-0000-4000-8000-000000000003", level: "district", countryCode: "TH", demoMarket: false, names: n("Hin Kong", "หินกอง", "Хин Конг", "הין קונג") },
  { id: "a2000001-0000-4000-8000-000000000009", slug: "th-samui", parentId: "a2000001-0000-4000-8000-000000000002", level: "locality", countryCode: "TH", demoMarket: false, names: n("Koh Samui", "เกาะสมุย", "Самуи", "קו סמוי") },
  { id: "a2000001-0000-4000-8000-000000000010", slug: "nathon", parentId: "a2000001-0000-4000-8000-000000000009", level: "district", countryCode: "TH", demoMarket: false, names: n("Nathon", "นาทอน", "Натон", "נאתון") },
  { id: "a2000001-0000-4000-8000-000000000011", slug: "maenam", parentId: "a2000001-0000-4000-8000-000000000009", level: "district", countryCode: "TH", demoMarket: false, names: n("Maenam", "แม่น้ำ", "Маенам", "מאנאם") },
  { id: "a2000001-0000-4000-8000-000000000012", slug: "bophut", parentId: "a2000001-0000-4000-8000-000000000009", level: "district", countryCode: "TH", demoMarket: false, names: n("Bophut", "บ่อผุด", "Бопхут", "בופוט") },
  { id: "a2000001-0000-4000-8000-000000000013", slug: "chaweng", parentId: "a2000001-0000-4000-8000-000000000009", level: "district", countryCode: "TH", demoMarket: false, names: n("Chaweng", "เฉวง", "Чавенг", "צ׳וואנג") },
  { id: "a2000001-0000-4000-8000-000000000014", slug: "lamai", parentId: "a2000001-0000-4000-8000-000000000009", level: "district", countryCode: "TH", demoMarket: false, names: n("Lamai", "ละไม", "Ламай", "למאי") },
  { id: "a2000001-0000-4000-8000-000000000015", slug: "lipa-noi", parentId: "a2000001-0000-4000-8000-000000000009", level: "district", countryCode: "TH", demoMarket: false, names: n("Lipa Noi", "ลิปะน้อย", "Липа Ной", "ליפה נוי") },
  { id: "a2000001-0000-4000-8000-000000000016", slug: "th-tao", parentId: "a2000001-0000-4000-8000-000000000002", level: "locality", countryCode: "TH", demoMarket: false, names: n("Koh Tao", "เกาะเต่า", "Тао", "קו טאו") },
  { id: "a2000001-0000-4000-8000-000000000017", slug: "mae-haad", parentId: "a2000001-0000-4000-8000-000000000016", level: "district", countryCode: "TH", demoMarket: false, names: n("Mae Haad", "แม่หาด", "Мэ Хад", "מה האד") },
  { id: "a2000001-0000-4000-8000-000000000018", slug: "sairee", parentId: "a2000001-0000-4000-8000-000000000016", level: "district", countryCode: "TH", demoMarket: false, names: n("Sairee", "ทรายรี", "Саири", "סאירי") },
  { id: "a2000001-0000-4000-8000-000000000019", slug: "chalok-baan-kao", parentId: "a2000001-0000-4000-8000-000000000016", level: "district", countryCode: "TH", demoMarket: false, names: n("Chalok Baan Kao", "โฉลกบ้านเก่า", "Чалок Бан Као", "צ׳אלוק באן קאו") },
  { id: "a2000001-0000-4000-8000-000000000020", slug: "hin-wong", parentId: "a2000001-0000-4000-8000-000000000016", level: "district", countryCode: "TH", demoMarket: false, names: n("Hin Wong", "หินวง", "Хин Вонг", "הין וונג") },
  { id: "a2000001-0000-4000-8000-000000000021", slug: "tanote", parentId: "a2000001-0000-4000-8000-000000000016", level: "district", countryCode: "TH", demoMarket: false, names: n("Tanote", "หาดตาโนด", "Танот", "טאנוט") },
];

const PHANGAN = "a2000001-0000-4000-8000-000000000003";
const PHANGAN_AREAS = AREAS.filter((a) => a.parentId === PHANGAN).map((a) => a.id);
const HVAC = "c2000001-0000-4000-8000-000000000001";
const PLUMB = "c2000001-0000-4000-8000-000000000002";
const ELEC = "c2000001-0000-4000-8000-000000000003";
const CLEAN = "c2000001-0000-4000-8000-000000000005";
const POOL = "c2000001-0000-4000-8000-000000000007";
const GARDEN = "c2000001-0000-4000-8000-000000000008";

function seedPro(input: Omit<ProProfile, "listingTier" | "translations" | "photos" | "checks" | "createdAt" | "claimedAt" | "descriptionLocale"> & { descriptionLocale?: string }): ProProfile {
  return {
    ...input,
    descriptionLocale: input.descriptionLocale ?? "en",
    translations: {},
    photos: [],
    checks: { email: null, phone: null, identity: null, business: null, qualification: null },
    listingTier: "free",
    claimedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

/** Built from the existing demo vendor contacts. No ratings and no job counts. */
export const SEED_PROFILES: ProProfile[] = [
  seedPro({
    id: "p2000001-0000-4000-8000-000000000001",
    contactId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    orgId: DEMO_ORG_ID,
    linkedProfileId: DEMO_CLEANER_ID,
    name: "Nok Cleaning",
    description: "Turnover cleaning for villas.",
    photoUrl: null,
    categoryIds: [CLEAN],
    areaIds: PHANGAN_AREAS,
    languages: ["th", "en"],
    phone: "66819876543",
    lineId: null,
    whatsapp: "66819876543",
    visibility: "private",
    status: "active",
    available: true,
    consentAt: "2026-01-01T00:00:00.000Z",
    consentBy: DEMO_OWNER_ID,
    consentNote: "Listed from an existing vendor contact.",
    claimToken: "d1000001-0000-4000-8000-000000000001",
  }),
  seedPro({
    id: "p2000001-0000-4000-8000-000000000002",
    contactId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    orgId: DEMO_ORG_ID,
    linkedProfileId: null,
    name: "Mai Housekeeping",
    description: "Housekeeping.",
    photoUrl: null,
    categoryIds: [CLEAN],
    areaIds: ["a2000001-0000-4000-8000-000000000004", "a2000001-0000-4000-8000-000000000006"],
    languages: ["th"],
    phone: "66818765432",
    lineId: "mai.clean",
    whatsapp: null,
    visibility: "private",
    status: "active",
    available: true,
    consentAt: "2026-01-01T00:00:00.000Z",
    consentBy: DEMO_OWNER_ID,
    consentNote: "Listed from an existing vendor contact.",
    claimToken: "d1000001-0000-4000-8000-000000000002",
  }),
  seedPro({
    id: "p2000001-0000-4000-8000-000000000003",
    contactId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
    orgId: DEMO_ORG_ID,
    linkedProfileId: null,
    name: "Somchai Plumbing",
    description: "Plumbing, including urgent leaks.",
    photoUrl: null,
    categoryIds: [PLUMB],
    areaIds: ["a2000001-0000-4000-8000-000000000004", "a2000001-0000-4000-8000-000000000008"],
    languages: ["th", "en"],
    phone: "66817654321",
    lineId: null,
    whatsapp: "66817654321",
    visibility: "public",
    status: "active",
    available: true,
    consentAt: "2026-01-01T00:00:00.000Z",
    consentBy: DEMO_OWNER_ID,
    consentNote: "Vendor agreed to a public listing.",
    claimToken: "d1000001-0000-4000-8000-000000000003",
  }),
  seedPro({
    id: "p2000001-0000-4000-8000-000000000004",
    contactId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
    orgId: DEMO_ORG_ID,
    linkedProfileId: null,
    name: "Bee Electric",
    description: "Electrical work.",
    photoUrl: null,
    categoryIds: [ELEC],
    areaIds: PHANGAN_AREAS,
    languages: ["th", "en"],
    phone: "66816543210",
    lineId: "beeelectric",
    whatsapp: null,
    visibility: "private",
    status: "active",
    available: true,
    consentAt: "2026-01-01T00:00:00.000Z",
    consentBy: DEMO_OWNER_ID,
    consentNote: "Listed from an existing vendor contact.",
    claimToken: "d1000001-0000-4000-8000-000000000004",
  }),
  seedPro({
    id: "p2000001-0000-4000-8000-000000000005",
    contactId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5",
    orgId: DEMO_ORG_ID,
    linkedProfileId: null,
    name: "Island Pool Care",
    description: "Weekly pool care.",
    photoUrl: null,
    categoryIds: [POOL],
    areaIds: PHANGAN_AREAS,
    languages: ["th", "en"],
    phone: "66815432109",
    lineId: null,
    whatsapp: "66815432109",
    visibility: "private",
    status: "active",
    available: true,
    consentAt: "2026-01-01T00:00:00.000Z",
    consentBy: DEMO_OWNER_ID,
    consentNote: "Listed from an existing vendor contact.",
    claimToken: "d1000001-0000-4000-8000-000000000005",
  }),
  seedPro({
    id: "p2000001-0000-4000-8000-000000000006",
    contactId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6",
    orgId: DEMO_ORG_ID,
    linkedProfileId: null,
    name: "Green Thumb Garden",
    description: "Garden upkeep.",
    photoUrl: null,
    categoryIds: [GARDEN],
    areaIds: ["a2000001-0000-4000-8000-000000000006", "a2000001-0000-4000-8000-000000000005"],
    languages: ["th"],
    phone: "66814321098",
    lineId: null,
    whatsapp: null,
    visibility: "private",
    status: "active",
    available: false,
    consentAt: "2026-01-01T00:00:00.000Z",
    consentBy: DEMO_OWNER_ID,
    consentNote: "Listed from an existing vendor contact.",
    claimToken: "d1000001-0000-4000-8000-000000000006",
  }),
  seedPro({
    id: "p2000001-0000-4000-8000-000000000007",
    contactId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7",
    orgId: DEMO_ORG_ID,
    linkedProfileId: null,
    name: "CoolAir Repair",
    description: "Air-conditioning service and repair.",
    photoUrl: null,
    categoryIds: [HVAC],
    areaIds: PHANGAN_AREAS,
    languages: ["th", "en", "ru"],
    phone: "66813210987",
    lineId: null,
    whatsapp: "66813210987",
    visibility: "public",
    status: "active",
    available: true,
    consentAt: "2026-01-01T00:00:00.000Z",
    consentBy: DEMO_OWNER_ID,
    consentNote: "Vendor agreed to a public listing.",
    claimToken: "d1000001-0000-4000-8000-000000000007",
  }),
];

export function prosLang(locale: string): ProsLang {
  return isLocale(locale) ? locale : "en";
}

export function localizedName(
  names: Record<string, string>,
  locale: string,
) {
  const lang = prosLang(locale);
  return names[lang] || names.en || Object.values(names)[0] || "";
}

/** Merge fr/de/es/it/tr/ar/my labels from catalog-extra into in-memory catalog rows. */
export function applyCatalogLocaleExtras() {
  // Imported lazily to avoid circular init with generated packs.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@/lib/pros/catalog-extra") as {
    CATALOG_NAME_EXTRAS: Record<string, Record<string, string>>;
    CATALOG_DESC_EXTRAS: Record<string, Record<string, string>>;
  };
  for (const cat of CATEGORIES) {
    for (const [loc, pack] of Object.entries(mod.CATALOG_NAME_EXTRAS || {})) {
      const text = pack?.[cat.slug];
      if (text) (cat.names as Record<string, string>)[loc] = text;
    }
    for (const [loc, pack] of Object.entries(mod.CATALOG_DESC_EXTRAS || {})) {
      const text = pack?.[cat.slug];
      if (text) (cat.descriptions as Record<string, string>)[loc] = text;
    }
  }
  for (const area of AREAS) {
    for (const [loc, pack] of Object.entries(mod.CATALOG_NAME_EXTRAS || {})) {
      const text = pack?.[area.slug];
      if (text) (area.names as Record<string, string>)[loc] = text;
    }
  }
}

applyCatalogLocaleExtras();

export function createSeedState(): ProsState {
  const market = AREAS.find((a) => a.demoMarket);
  return {
    version: 1,
    placeId: market?.id ?? null,
    profiles: SEED_PROFILES,
    requests: [],
    offers: [],
    jobs: [],
    reviews: [],
    reports: [],
    events: [],
    categoriesExtra: [],
    areasExtra: [],
    languageByUser: {},
    favourites: {},
  };
}
