"use client";

import { LocaleProvider } from "@/lib/i18n/provider";
import { TranslateContentProvider } from "@/lib/translate/use-localized-content";
import { ActionBusyOverlay } from "@/components/ui/action-busy-overlay";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <TranslateContentProvider>
        {children}
        <ActionBusyOverlay />
      </TranslateContentProvider>
    </LocaleProvider>
  );
}
