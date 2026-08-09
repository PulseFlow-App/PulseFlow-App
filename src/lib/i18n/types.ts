export const LOCALES = [
  "en",
  "th",
  "my",
  "fr",
  "de",
  "es",
  "it",
  "he",
  "ru",
] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_META: Record<
  Locale,
  { label: string; native: string; dir: "ltr" | "rtl" }
> = {
  en: { label: "English", native: "English", dir: "ltr" },
  th: { label: "Thai", native: "ไทย", dir: "ltr" },
  my: { label: "Burmese", native: "မြန်မာ", dir: "ltr" },
  fr: { label: "French", native: "Français", dir: "ltr" },
  de: { label: "German", native: "Deutsch", dir: "ltr" },
  es: { label: "Spanish", native: "Español", dir: "ltr" },
  it: { label: "Italian", native: "Italiano", dir: "ltr" },
  he: { label: "Hebrew", native: "עברית", dir: "rtl" },
  ru: { label: "Russian", native: "Русский", dir: "ltr" },
};

export const LOCALE_STORAGE_KEY = "pulseflow_locale";
