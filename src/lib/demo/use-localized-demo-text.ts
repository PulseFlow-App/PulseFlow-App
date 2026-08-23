"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { localizeDemoText } from "@/lib/demo/localize";
import { capitalizeLabel } from "@/lib/format-label";

/**
 * Display free-text that may be English demo/system copy.
 * Translates known demo phrases; otherwise applies light capitalization.
 */
export function useLocalizedDemoText() {
  const { t, locale } = useI18n();
  return useCallback(
    (text: string | null | undefined) => {
      if (text == null || text === "") return "";
      const localized = localizeDemoText(text, t);
      if (localized !== text) return localized;
      // Avoid mangling non-Latin scripts the user typed.
      if (locale !== "en" && /[^\u0000-\u00ff]/.test(text)) return text;
      return capitalizeLabel(text);
    },
    [t, locale],
  );
}
