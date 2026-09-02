import type { Metadata } from "next";
import { PulseMark } from "@/components/brand/pulse-mark";
import { LegalShell } from "@/components/legal/legal-shell";
import {
  AudienceSections,
  LegalDocumentFooter,
  LegalIntro,
  PrivacyCommonSections,
  PrivacySummary,
  TermsCommonSections,
  TermsSummary,
} from "@/components/legal/legal-sections";
import { brand } from "@/lib/design-tokens";
import {
  legalAudienceLabel,
  parseLegalAudience,
  type LegalAudience,
} from "@/lib/legal/audiences";
import { createPageMetadata } from "@/lib/seo";

type Props = {
  searchParams: Promise<{ for?: string }>;
};

function termsMetadata(audience: LegalAudience): Metadata {
  const label = legalAudienceLabel(audience);
  const title = label ? `Terms of Service · ${label}` : "Terms of Service";
  return createPageMetadata({
    title,
    description: `Terms of Service for ${brand.name}: property and rental operations software.`,
    path: audience === "all" ? "/terms" : `/terms?for=${audience}`,
  });
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  return termsMetadata(parseLegalAudience(params.for));
}

export default async function TermsPage({ searchParams }: Props) {
  const params = await searchParams;
  const audience = parseLegalAudience(params.for);
  const audienceLabel = legalAudienceLabel(audience);

  return (
    <LegalShell>
      <div className="space-y-6 text-sm leading-relaxed text-ink">
        <PulseMark className="size-10" />
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Terms of Service
          </h1>
          {audienceLabel ? (
            <p className="mt-0.5 text-sm font-semibold text-primary">
              {audienceLabel}
            </p>
          ) : null}
          <p className="mt-1 text-muted">
            {brand.name} · Last updated: 2 September 2026
          </p>
        </div>

        <LegalIntro kind="terms" audience={audience} />
        <TermsSummary />
        <AudienceSections audience={audience} kind="terms" />
        <TermsCommonSections />
        <LegalDocumentFooter audience={audience} kind="terms" />
      </div>
    </LegalShell>
  );
}
