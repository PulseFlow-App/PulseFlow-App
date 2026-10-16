import type { Metadata } from "next";
import Link from "next/link";
import { PulseMark } from "@/components/brand/pulse-mark";
import { LegalShell } from "@/components/legal/legal-shell";
import { brand } from "@/lib/design-tokens";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Support",
  description: `Help, billing, and account deletion for ${brand.name}.`,
  path: "/support",
});

export default function SupportPage() {
  return (
    <LegalShell>
      <div className="mb-6 flex items-center gap-3">
        <PulseMark className="size-10 shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Support
          </h1>
          <p className="text-sm text-muted">{brand.name}</p>
        </div>
      </div>

      <div className="space-y-5 text-sm leading-relaxed text-ink">
        <section className="space-y-2 rounded-[var(--radius-card)] bg-card p-4 soft-shadow">
          <h2 className="font-display text-lg font-bold">Get help</h2>
          <p className="text-muted">
            Questions, bugs, billing, or privacy requests: email{" "}
            <a
              className="font-semibold text-primary"
              href={`mailto:${brand.supportEmail}`}
            >
              {brand.supportEmail}
            </a>
            . We monitor this inbox for App Review and customer support.
          </p>
        </section>

        <section className="space-y-2 rounded-[var(--radius-card)] bg-card p-4 soft-shadow">
          <h2 className="font-display text-lg font-bold">Delete your account</h2>
          <p className="text-muted">
            Signed-in users can delete their account in the app under{" "}
            <strong className="font-semibold text-ink">Settings → Delete account</strong>
            . That removes your login and profile. Company workspace data owned by
            others may remain for the organization.
          </p>
          <p className="text-muted">
            Prefer email? Write to{" "}
            <a
              className="font-semibold text-primary"
              href={`mailto:${brand.supportEmail}?subject=Delete%20my%20Pulse%20Flow%20account`}
            >
              {brand.supportEmail}
            </a>{" "}
            from the address on your account.
          </p>
        </section>

        <section className="space-y-2 rounded-[var(--radius-card)] bg-card p-4 soft-shadow">
          <h2 className="font-display text-lg font-bold">
            Cancel a company subscription
          </h2>
          <p className="text-muted">
            Company owners manage billing in{" "}
            <strong className="font-semibold text-ink">Settings → Plan</strong>{" "}
            (Stripe Customer Portal). Personal workspaces are free and have no
            subscription.
          </p>
        </section>

        <section className="space-y-2 rounded-[var(--radius-card)] bg-card p-4 soft-shadow">
          <h2 className="font-display text-lg font-bold">Legal</h2>
          <ul className="space-y-1.5 text-muted">
            <li>
              <Link href="/terms" className="font-semibold text-primary">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="font-semibold text-primary">
                Privacy Policy
              </Link>
            </li>
            <li>
              <a
                href="https://www.pulseflow.site"
                className="font-semibold text-primary"
              >
                Website
              </a>
            </li>
          </ul>
        </section>
      </div>
    </LegalShell>
  );
}
