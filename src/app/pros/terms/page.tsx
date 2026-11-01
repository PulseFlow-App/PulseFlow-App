"use client";

import { useI18n } from "@/lib/i18n/provider";
import { LEGAL_UPDATED, legalGroupTitle, legalSections, legalTitle, type LegalAudience } from "@/lib/pros/legal";

const GROUPS: LegalAudience[] = ["customer", "staff"];

export default function ServicesTermsPage() {
  const { locale } = useI18n();
  return (
    <article className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink">{legalTitle("terms", locale)}</h1>
        <p className="mt-1 text-xs text-muted">{LEGAL_UPDATED}</p>
      </header>
      {GROUPS.map((audience) => (
        <section key={audience} className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink">{legalGroupTitle(audience, locale)}</h2>
          {legalSections("terms", locale, audience).map((section) => (
            <div key={section.id}>
              <h3 className="text-sm font-semibold text-ink">{section.heading}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{section.body}</p>
            </div>
          ))}
        </section>
      ))}
    </article>
  );
}
