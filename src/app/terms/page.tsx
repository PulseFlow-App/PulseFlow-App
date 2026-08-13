import Link from "next/link";
import { PulseMark } from "@/components/brand/pulse-mark";
import { brand } from "@/lib/design-tokens";

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-sand px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6 text-sm leading-relaxed text-ink">
        <PulseMark className="size-10" />
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Terms of Service
          </h1>
          <p className="mt-1 text-muted">
            {brand.name} · Last updated: 13 August 2026
          </p>
        </div>

        <p className="text-muted">
          These Terms govern your use of {brand.name} (the “Service”), including
          the web app at app.pulseflow.site and related sites. By creating an
          account or using the Service, you agree to these Terms.
        </p>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">1. Who we are</h2>
          <p className="text-muted">
            {brand.name} is an operations tool for villa and short-term rental
            teams: property status, tasks, contacts, team chat, bills, and
            related workflows. The Service is provided by the Pulse Flow Ops
            product team (“we”, “us”).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">2. Accounts & workspaces</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>
              You must provide accurate registration details and keep your login
              secure.
            </li>
            <li>
              <strong className="text-ink">Personal workspaces</strong> are free
              and intended for solo use.
            </li>
            <li>
              <strong className="text-ink">Company workspaces</strong> support
              teams (owners, managers, staff). Company features—invites, team
              chat, in-app ordering, reputation, and related tools—require an
              eligible company plan.
            </li>
            <li>
              You are responsible for activity under your account and for people
              you invite into your organization.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">3. Trials & billing</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>
              New company organizations receive a{" "}
              <strong className="text-ink">30-day free trial</strong> of company
              features.
            </li>
            <li>
              After the trial, the{" "}
              <strong className="text-ink">company owner</strong> must keep an
              active paid subscription for invite, villa, service-order, and
              other gated company writes. Managers, cleaners, and staff are not
              billed personally.
            </li>
            <li>
              Subscriptions are processed by Stripe. Prices, renewal, and taxes
              are shown at checkout or in the billing portal.
            </li>
            <li>
              You may cancel or manage billing through the in-app portal where
              available. Access to paid company features may end when a
              subscription lapses.
            </li>
            <li>
              Fees already charged for a billing period are generally
              non-refundable except where required by law or stated otherwise at
              purchase.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">4. Acceptable use</h2>
          <p className="text-muted">You agree not to:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>Use the Service for unlawful, harmful, or fraudulent activity</li>
            <li>Upload malware or attempt to breach security or other users’ data</li>
            <li>Harass staff or misuse chat, mentions, or notifications</li>
            <li>Scrape, reverse engineer, or overload the Service unreasonably</li>
            <li>
              Store or share content you do not have rights to (including guest
              data you are not authorized to process)
            </li>
          </ul>
          <p className="text-muted">
            We may suspend or terminate accounts that violate these rules or
            create risk for the Service or other customers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">5. Your content & data</h2>
          <p className="text-muted">
            You retain ownership of villas, tasks, contacts, messages, bills,
            photos, and other data you submit (“Customer Content”). You grant us
            a limited license to host, process, and display Customer Content
            solely to operate and improve the Service.
          </p>
          <p className="text-muted">
            You are responsible for the legality of Customer Content and for
            complying with local privacy and employment rules when you invite
            staff or store guest/property information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">6. Service availability</h2>
          <p className="text-muted">
            We aim for reliable uptime but do not guarantee uninterrupted access.
            Features may change as we improve the product. We may perform
            maintenance, and demo/seed environments may differ from production.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">7. Disclaimers</h2>
          <p className="text-muted">
            The Service is provided “as is”. To the fullest extent permitted by
            law, we disclaim warranties of merchantability, fitness for a
            particular purpose, and non-infringement. {brand.name} helps
            coordinate operations; it is not legal, tax, accounting, or
            insurance advice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">8. Limitation of liability</h2>
          <p className="text-muted">
            To the fullest extent permitted by law, we are not liable for
            indirect, incidental, special, consequential, or lost-profit
            damages, or for loss of data arising from your use of the Service.
            Our aggregate liability for claims relating to the Service in any
            twelve-month period is limited to the fees you paid us for the
            Service in that period (or USD 100 if you paid nothing).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">9. Termination</h2>
          <p className="text-muted">
            You may stop using the Service at any time. We may suspend or end
            access for breach of these Terms, non-payment, or if we discontinue
            the product. Upon termination, your right to use the Service ends;
            sections that by nature should survive (including liability limits
            and ownership) continue to apply.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">10. Changes</h2>
          <p className="text-muted">
            We may update these Terms. Material changes will be posted on this
            page with a new “Last updated” date. Continued use after changes
            take effect means you accept the updated Terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">11. Contact</h2>
          <p className="text-muted">
            Questions about these Terms:{" "}
            <a
              className="font-semibold text-primary"
              href="mailto:hello@pulseflow.site"
            >
              hello@pulseflow.site
            </a>
            . See also our{" "}
            <Link href="/privacy" className="font-semibold text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <p className="text-xs text-muted">
          These Terms are a practical product agreement, not a substitute for
          advice from your own counsel.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <Link href="/privacy" className="font-semibold text-primary">
            Privacy Policy
          </Link>
          <Link href="/register" className="font-semibold text-primary">
            Back to register
          </Link>
          <Link href="/login" className="font-semibold text-muted">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
