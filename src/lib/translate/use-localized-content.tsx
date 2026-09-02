"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useI18n } from "@/lib/i18n/provider";
import { localizeDemoText, isKnownDemoPhrase } from "@/lib/demo/localize";
import { fetchTranslation } from "@/lib/translate/client";
import { likelySameLanguage } from "@/lib/translate/locale-script";
import {
  readTranslateContentEnabled,
  writeTranslateContentEnabled,
} from "@/lib/translate/preferences";

type TranslateContentContextValue = {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
};

const TranslateContentContext =
  createContext<TranslateContentContextValue | null>(null);

export function TranslateContentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    setEnabledState(readTranslateContentEnabled());
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    writeTranslateContentEnabled(next);
  }, []);

  const value = useMemo(
    () => ({ enabled, setEnabled }),
    [enabled, setEnabled],
  );

  return (
    <TranslateContentContext.Provider value={value}>
      {children}
    </TranslateContentContext.Provider>
  );
}

export function useTranslateContentEnabled(): boolean {
  const ctx = useContext(TranslateContentContext);
  return ctx?.enabled ?? true;
}

export function useTranslateContentSettings() {
  const ctx = useContext(TranslateContentContext);
  if (!ctx) {
    throw new Error(
      "useTranslateContentSettings must be used within TranslateContentProvider",
    );
  }
  return ctx;
}

function syncLocalizedText(
  text: string,
  locale: string,
  t: ReturnType<typeof useI18n>["t"],
  translateEnabled: boolean,
): string | null {
  if (isKnownDemoPhrase(text)) {
    return localizeDemoText(text, t);
  }

  const demo = localizeDemoText(text, t);
  if (demo !== text) return demo;

  if (locale === "en" || !translateEnabled) {
    return text;
  }

  if (likelySameLanguage(text, locale as Parameters<typeof likelySameLanguage>[1])) {
    return text;
  }

  return null;
}

/**
 * Display team-authored text (tasks, chat, briefings) in the active locale.
 * Known demo phrases use dictionary keys; everything else goes through /api/translate.
 */
export function useLocalizedContent() {
  const { t, locale } = useI18n();
  const translateEnabled = useTranslateContentEnabled();

  const localize = useCallback(
    (text: string | null | undefined) => {
      if (text == null || text === "") return "";
      const sync = syncLocalizedText(text, locale, t, translateEnabled);
      return sync ?? text;
    },
    [locale, t, translateEnabled],
  );

  return { localize, locale, translateEnabled };
}

/** Hook for a single string with async translation when needed. */
export function useLocalizedText(text: string | null | undefined): {
  display: string;
  loading: boolean;
  isTranslated: boolean;
} {
  const { t, locale } = useI18n();
  const translateEnabled = useTranslateContentEnabled();
  const raw = text ?? "";

  const sync = useMemo(() => {
    if (!raw) return "";
    return syncLocalizedText(raw, locale, t, translateEnabled);
  }, [raw, locale, t, translateEnabled]);

  const [asyncText, setAsyncText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!raw || sync !== null) {
      setAsyncText(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void fetchTranslation(raw, locale).then((translated) => {
      if (cancelled) return;
      setAsyncText(translated);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [raw, sync, locale]);

  const display = sync ?? asyncText ?? raw;
  const isTranslated = !!raw && display !== raw && !loading;

  return { display, loading, isTranslated };
}
