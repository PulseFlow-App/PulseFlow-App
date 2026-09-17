import type { Locale } from "@/lib/i18n";
import { detectLikelySourceLocale } from "@/lib/translate/locale-script";

const MYMEMORY_LANG: Record<Locale, string> = {
  en: "en",
  th: "th",
  my: "my",
  fr: "fr",
  de: "de",
  es: "es",
  it: "it",
  he: "he",
  ar: "ar",
  ru: "ru",
};

async function translateWithGoogle(
  text: string,
  target: Locale,
  source?: string,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://translation.googleapis.com/language/translate/v2");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", text);
  url.searchParams.set("target", MYMEMORY_LANG[target] ?? target);
  if (source) url.searchParams.set("source", source);

  const res = await fetch(url.toString(), { method: "POST" });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: { translations?: { translatedText?: string }[] };
  };
  return json.data?.translations?.[0]?.translatedText ?? null;
}

async function translateWithMyMemory(
  text: string,
  target: Locale,
  source: string,
): Promise<string | null> {
  const langpair = `${source}|${MYMEMORY_LANG[target] ?? target}`;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", langpair);

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    responseStatus?: number;
    responseData?: { translatedText?: string };
  };
  if (json.responseStatus !== 200) return null;

  const out = json.responseData?.translatedText?.trim();
  if (!out || out.toUpperCase() === text.toUpperCase()) return null;
  return out;
}

/** Server-side translation for team-authored content into the viewer's locale. */
export async function translateUserContent(
  text: string,
  target: Locale,
  source?: string,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const detected =
    source ?? detectLikelySourceLocale(trimmed) ?? undefined;
  if (detected && detected === target) return text;

  const google = await translateWithGoogle(trimmed, target, detected);
  if (google) return google;

  // MyMemory needs an explicit pair; prefer detected script, else Autodetect.
  const mymemorySource = detected ?? "Autodetect";
  const mymemory = await translateWithMyMemory(
    trimmed,
    target,
    mymemorySource,
  );
  if (mymemory) return mymemory;

  // Last resort: if we guessed wrong and Autodetect failed, try en as source
  // for non-English targets (legacy dictionary / demo fill path).
  if (target !== "en" && mymemorySource !== "en") {
    const fromEn = await translateWithMyMemory(trimmed, target, "en");
    if (fromEn) return fromEn;
  }

  return text;
}
