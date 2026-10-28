/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
"use client";

import { LocaleProvider } from "@/lib/i18n/provider";
import { AppearanceProvider } from "@/lib/appearance/provider";
import { TranslateContentProvider } from "@/lib/translate/use-localized-content";
import { ActionBusyOverlay } from "@/components/ui/action-busy-overlay";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AppearanceProvider>
        <TranslateContentProvider>
          {children}
          <ActionBusyOverlay />
          <ServiceWorkerRegister />
        </TranslateContentProvider>
      </AppearanceProvider>
    </LocaleProvider>
  );
}
