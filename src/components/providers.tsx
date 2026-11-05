/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
"use client";

import { LocaleProvider } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/types";
import { AppearanceProvider } from "@/lib/appearance/provider";
import { TranslateContentProvider } from "@/lib/translate/use-localized-content";
import { ActionBusyOverlay } from "@/components/ui/action-busy-overlay";
import { EmailLinkSession } from "@/components/auth/email-link-session";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";

export function Providers({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <AppearanceProvider>
        <TranslateContentProvider>
          {children}
          <EmailLinkSession />
          <ActionBusyOverlay />
          <ServiceWorkerRegister />
        </TranslateContentProvider>
      </AppearanceProvider>
    </LocaleProvider>
  );
}
