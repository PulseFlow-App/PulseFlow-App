import type { Locale } from "@/lib/i18n";

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
  source = "en",
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

/** Server-side translation for team-authored content. */
export async function translateUserContent(
  text: string,
  target: Locale,
  source?: string,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || target === "en") return text;

  const google = await translateWithGoogle(trimmed, target, source);
  if (google) return google;

  const mymemory = await translateWithMyMemory(trimmed, target, source ?? "en");
  if (mymemory) return mymemory;

  return text;
}
