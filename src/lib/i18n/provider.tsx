"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LOCALE_META,
  LOCALE_STORAGE_KEY,
  isLocale,
  translate,
  type Locale,
  type MessageKey,
} from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const nav = navigator.language.slice(0, 2).toLowerCase();
  if (isLocale(nav)) return nav;
  if (nav === "iw") return "he";
  return "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const meta = LOCALE_META[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
    document.documentElement.dataset.locale = locale;
  }, [locale, ready]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
      dir: LOCALE_META[locale].dir,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within LocaleProvider");
  }
  return ctx;
}

/** Safe for components that may render outside provider during SSR edge cases. */
export function useOptionalI18n() {
  return useContext(I18nContext);
}
