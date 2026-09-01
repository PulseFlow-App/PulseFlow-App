"use client";

import { LocaleProvider } from "@/lib/i18n/provider";
import { TranslateContentProvider } from "@/lib/translate/use-localized-content";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <TranslateContentProvider>{children}</TranslateContentProvider>
    </LocaleProvider>
  );
}
