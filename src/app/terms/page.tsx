import Link from "next/link";
import type { Metadata } from "next";
import { PulseMark } from "@/components/brand/pulse-mark";
import { LegalShell } from "@/components/legal/legal-shell";
import { brand } from "@/lib/design-tokens";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Service",
  description: `Terms of Service for ${brand.name}: property and rental operations software.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalShell>
      <div className="space-y-6 text-sm leading-relaxed text-ink">
        <PulseMark className="size-10" />
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Terms of Service
          </h1>
          <p className="mt-1 text-muted">
            {brand.name} · Last updated: 2 September 2026
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
            {brand.name} is an operations tool for property and short-term rental
            teams: property status, tasks, contacts, team chat, bills, guest
            stays (date requests, quotes, deposits), and related workflows. The
            Service is provided by the Pulse Flow product team (“we”, “us”).
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
              teams (owners, managers, staff). Company features (invites, team
              chat, in-app ordering, reputation, and related tools) require an
              eligible company plan.
            </li>
            <li>
              You are responsible for activity under your account and for people
              you invite into your organization.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">
            3. Free access, billing & referrals
          </h2>
          <p className="text-muted">
            We are still setting up paid billing. Until Stripe checkout is live:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>
              Every registered user receives a{" "}
              <strong className="text-ink">3-month free period</strong> with full
              features from registration.
            </li>
            <li>
              Personal workspaces stay free. Company owners are not charged while
              billing is unavailable.
            </li>
            <li>
              When billing goes live, the{" "}
              <strong className="text-ink">company owner</strong> must keep an
              active subscription for invite, property, service-order, and other
              gated company writes. Managers, cleaners, and staff are not billed
              personally.
            </li>
            <li>
              Subscriptions will be processed by Stripe. Prices, renewal, and
              taxes will appear at checkout or in the billing portal.
            </li>
            <li>
              Fees already charged for a billing period are generally
              non-refundable except where required by law.
            </li>
          </ul>
          <p className="text-muted">
            <strong className="text-ink">Referral reward:</strong> invite 5 people
            who register for the app or join your company as staff (both count).
            Copy your referral link in Profile. When subscription billing starts,
            5 credited joins unlock{" "}
            <strong className="text-ink">1 year of Full</strong> starting from
            that billing start date (or from the end of your initial 3-month free
            period, whichever is later).
          </p>
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
          <h2 className="font-display text-lg font-bold">5. Talent directory</h2>
          <p className="text-muted">
            Field staff and managers may opt in to appear in the in-app talent
            directory so property owners and managers can discover them by skill
            and location (including an optional map pin). Listing is voluntary
            and controlled in Settings. Public reputation pages may show weekly
            endorsements and optional review notes from past teams.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>
              {brand.name} is a discovery and reputation tool, not an employer,
              staffing agency, or party to any work agreement between users.
            </li>
            <li>
              Owners and managers are solely responsible for vetting, hiring,
              paying, and supervising anyone they contact through the directory.
            </li>
            <li>
              We may remove or hide listings that violate these Terms or create
              risk for other users.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">
            6. Guest stays, quotes & deposits
          </h2>
          <p className="text-muted">
            {brand.name} includes tools for guests invited by a property team
            to request dates, receive quotes, confirm stays, coordinate
            security deposits (off-platform), chat with their host, and view
            briefings. Property teams are solely responsible for rental
            agreements, pricing, deposit handling, refunds, and compliance with
            local short-term rental rules. {brand.name} is coordination software,
            not a travel agency, payment processor, or escrow provider.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>
              <strong className="text-ink">Date requests:</strong> guests submit
              preferred check-in/out dates and an optional note. Hosts respond
              with a quote (total price, optional deposit, when the deposit is
              due, and payment instructions such as bank transfer details).
            </li>
            <li>
              <strong className="text-ink">Accepting a quote</strong> creates a
              confirmed stay and blocks the villa dates. If a deposit was
              quoted, it appears as due until the host records payment.
            </li>
            <li>
              <strong className="text-ink">Deposits:</strong> guest-to-host
              payments happen outside {brand.name}. Guests pay hosts directly
              using instructions on the quote or in Bills. Guests should open
              Support, send <strong className="text-ink">/deposit</strong>, and
              may attach a receipt; hosts confirm with{" "}
              <strong className="text-ink">/deposit</strong> in Support or from
              the Guests panel.
            </li>
            <li>
              <strong className="text-ink">Deposit timing:</strong> a deposit
              may be marked due before arrival or on arrival on the quote.
              Guests are responsible for paying on time per the quote.
            </li>
            <li>
              <strong className="text-ink">Guest cancellation:</strong> at least
              3 days before check-in, guests may cancel from Stay home without
              host approval. Within 3 days of check-in, guests must open
              Support and send <strong className="text-ink">/cancel</strong> to
              request cancellation (subject to host discretion, especially if a
              deposit was already paid).
            </li>
            <li>
              <strong className="text-ink">Host cancellation:</strong> owners and
              managers may cancel a confirmed stay from Guests at any time; villa
              dates are freed and the guest is notified. If a before-arrival
              deposit remains unpaid or unconfirmed by the host, the property
              team may cancel the booking to protect the reservation.
            </li>
            <li>
              <strong className="text-ink">Support chat:</strong> messages,
              slash commands (<strong className="text-ink">/deposit</strong>,{" "}
              <strong className="text-ink">/cancel</strong>), and uploaded
              receipt images are visible to the guest and the property team for
              that stay.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">7. Your content & data</h2>
          <p className="text-muted">
            You retain ownership of properties, tasks, contacts, messages, bills,
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
          <h2 className="font-display text-lg font-bold">8. Service availability</h2>
          <p className="text-muted">
            We aim for reliable uptime but do not guarantee uninterrupted access.
            Features may change as we improve the product. We may perform
            maintenance, and demo/seed environments may differ from production.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">9. Disclaimers</h2>
          <p className="text-muted">
            The Service is provided “as is”. To the fullest extent permitted by
            law, we disclaim warranties of merchantability, fitness for a
            particular purpose, and non-infringement. {brand.name} helps
            coordinate operations; it is not legal, tax, accounting, or
            insurance advice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">10. Limitation of liability</h2>
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
          <h2 className="font-display text-lg font-bold">11. Termination</h2>
          <p className="text-muted">
            You may stop using the Service at any time. We may suspend or end
            access for breach of these Terms, non-payment, or if we discontinue
            the product. Upon termination, your right to use the Service ends;
            sections that by nature should survive (including liability limits
            and ownership) continue to apply.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">12. Changes</h2>
          <p className="text-muted">
            We may update these Terms. Material changes will be posted on this
            page with a new “Last updated” date. Continued use after changes
            take effect means you accept the updated Terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold">13. Contact</h2>
          <p className="text-muted">
            Questions about these Terms:{" "}
            <a
              className="font-semibold text-primary"
              href={`mailto:${brand.supportEmail}`}
            >
              {brand.supportEmail}
            </a>
            . See also our{" "}
            <Link href="/privacy" className="font-semibold text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <div className="flex flex-wrap gap-4 pt-2 pb-8">
          <Link href="/privacy" className="font-semibold text-primary">
            Privacy Policy
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
