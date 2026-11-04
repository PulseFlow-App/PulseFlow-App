"use client";

import { useI18n } from "@/lib/i18n/provider";
import { LEGAL_UPDATED, legalGroupTitle, legalSections, legalTitle, type LegalAudience } from "@/lib/pros/legal";

const GROUPS: LegalAudience[] = ["customer", "staff"];

export default function ServicesTermsPage() {
  const { locale } = useI18n();
  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{legalTitle("terms", locale)}</h1>
        <p className="mt-1 text-pf-12 text-pf-slate-ink">{LEGAL_UPDATED}</p>
      </header>
      {GROUPS.map((audience) => (
        <section key={audience} className="space-y-4">
          <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{legalGroupTitle(audience, locale)}</h2>
          {legalSections("terms", locale, audience).map((section) => (
            <div key={section.id}>
              <h3 className="text-pf-14 font-medium text-pf-ink">{section.heading}</h3>
              <p className="mt-1 text-pf-16 leading-relaxed text-pf-text-secondary">{section.body}</p>
            </div>
          ))}
        </section>
      ))}
    </article>
  );
}
