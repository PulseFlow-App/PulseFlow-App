import Link from "next/link";
import type { Metadata } from "next";
import { PulseMark } from "@/components/brand/pulse-mark";
import { LegalShell } from "@/components/legal/legal-shell";
import { brand } from "@/lib/design-tokens";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: `Privacy Policy for ${brand.name}: how we handle account and operations data.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalShell>
      <div className="space-y-6 text-sm leading-relaxed text-ink">
        <PulseMark className="size-10" />
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Privacy Policy
          </h1>
          <p className="mt-1 text-muted">
            {brand.name} · Last updated: 28 August 2026
          </p>
        </div>

        <p className="text-muted">
          This Privacy Policy explains how {brand.name} collects, uses, and
          shares information when you use app.pulseflow.site and related sites
          (the “Service”).
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">1. Information we collect</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>
              <strong className="text-ink">Account data:</strong> name, email,
              role, organization, and authentication identifiers.
            </li>
            <li>
              <strong className="text-ink">Operations data:</strong> properties,
              tasks, contacts, messages, service orders, bills, endorsements,
              notifications, and related metadata you or your team enter.
            </li>
            <li>
              <strong className="text-ink">Files:</strong> property photos and
              receipt images you upload (stored in our cloud storage).
            </li>
            <li>
              <strong className="text-ink">Billing data:</strong> when company
              billing is enabled, Stripe processes card details. We store Stripe
              customer and subscription IDs on the organization, not full card
              numbers.
            </li>
            <li>
              <strong className="text-ink">Referral data:</strong> referral
              codes, invite links, and join records used to track referral
              rewards.
            </li>
            <li>
              <strong className="text-ink">Talent directory data:</strong> if you
              opt in, your name, skills, optional bio, job title, ratings, and
              public profile slug are visible to property owners and managers
              searching for staff inside the Service.
            </li>
            <li>
              <strong className="text-ink">Technical data:</strong> device/browser
              type, IP address, and basic usage logs needed to secure and
              operate the Service.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">2. How we use information</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>Provide and improve rental operations features</li>
            <li>Authenticate users and enforce roles within an organization</li>
            <li>Send in-app notifications (jobs, chat mentions, bills)</li>
            <li>Operate the optional talent directory and public reputation pages</li>
            <li>Process company subscriptions and referral rewards when billing is active</li>
            <li>Respond to support requests and legal obligations</li>
          </ul>
          <p className="text-muted">
            We do not sell your personal information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">3. Sharing</h2>
          <p className="text-muted">We share data only as needed with:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>
              <strong className="text-ink">Infrastructure providers</strong>{" "}
              (hosting, database, file storage, auth) that process data on our
              instructions
            </li>
            <li>
              <strong className="text-ink">Stripe</strong> for company payments
              when billing is enabled
            </li>
            <li>
              <strong className="text-ink">Other Pulse Flow users:</strong> when
              you opt into the talent directory, owners and managers can see your
              listing; teammates you invite can see org data according to role
            </li>
            <li>
              Authorities when required by law or to protect the Service and
              users
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">4. Retention</h2>
          <p className="text-muted">
            We retain account and operations data while your organization is
            active and for a reasonable period afterward for backups, disputes,
            and legal compliance. You may request deletion of your account; some
            records may remain where we must keep them by law or for legitimate
            business needs (for example billing history).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">5. Security</h2>
          <p className="text-muted">
            We use industry-standard safeguards (encrypted transport, access
            controls, and provider security features). No method of transmission
            or storage is 100% secure; please use strong passwords and limit who
            you invite.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">6. Your choices</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>Update profile and organization settings in the app</li>
            <li>Manage or cancel company billing via the billing portal when available</li>
            <li>
              Contact us to access, correct, or delete personal data where
              applicable
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">7. International use</h2>
          <p className="text-muted">
            The Service may be hosted in regions chosen by our providers. If you
            use {brand.name} from another country, you understand your
            information may be processed outside your home jurisdiction with
            appropriate safeguards where required.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">8. Children</h2>
          <p className="text-muted">
            The Service is for business operations and is not directed at
            children under 16. We do not knowingly collect data from children.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">9. Changes</h2>
          <p className="text-muted">
            We may update this Policy and will post the new version with a
            revised date. Continued use of the Service after changes means you
            accept the updated Policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">10. Contact</h2>
          <p className="text-muted">
            Privacy questions:{" "}
            <a
              className="font-semibold text-primary"
              href={`mailto:${brand.supportEmail}`}
            >
              {brand.supportEmail}
            </a>
            . See also our{" "}
            <Link href="/terms" className="font-semibold text-primary">
              Terms of Service
            </Link>
            .
          </p>
        </section>

        <div className="flex flex-wrap gap-4 pt-2 pb-8">
          <Link href="/terms" className="font-semibold text-primary">
            Terms of Service
          </Link>
          <Link href="/settings" className="font-semibold text-primary">
            Settings
          </Link>
          <Link href="/login" className="font-semibold text-muted">
            Sign in
          </Link>
        </div>
      </div>
    </LegalShell>
  );
}
