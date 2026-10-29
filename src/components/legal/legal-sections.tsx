/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
import Link from "next/link";
import { brand } from "@/lib/design-tokens";
import {
  type LegalAudience,
  legalPageHref,
} from "@/lib/legal/audiences";

/** Bump when Terms or Privacy substantive text changes. */
export const LEGAL_LAST_UPDATED = "29 October 2026";

export function LegalIntro({
  kind,
  audience,
}: {
  kind: "terms" | "privacy";
  audience: LegalAudience;
}) {
  const label =
    audience === "guest"
      ? "stay guests"
      : audience === "owner"
        ? "owners and managers"
        : audience === "staff"
          ? "staff"
          : audience === "agent"
            ? "AI agent operators"
            : "all users";

  if (kind === "terms") {
    return (
      <p className="text-muted">
        These Terms govern your use of {brand.name} (the “Service”) at{" "}
        <a
          className="font-semibold text-primary"
          href="https://app.pulseflow.site"
        >
          app.pulseflow.site
        </a>
        ,{" "}
        <a
          className="font-semibold text-primary"
          href="https://www.pulseflow.site"
        >
          www.pulseflow.site
        </a>{" "}
        and related sites or apps. By creating an account or using the Service
        {audience !== "all" ? ` as ${label}` : ""}, you agree to these Terms.
      </p>
    );
  }

  return (
    <p className="text-muted">
      This policy explains how {brand.name} collects, uses and shares information
      when you use{" "}
      <a
        className="font-semibold text-primary"
        href="https://app.pulseflow.site"
      >
        app.pulseflow.site
      </a>
      ,{" "}
      <a
        className="font-semibold text-primary"
        href="https://www.pulseflow.site"
      >
        www.pulseflow.site
      </a>{" "}
      and related sites or apps (the “Service”). The Service is for owners,
      managers, staff and invited guests of rental properties
      {audience !== "all" ? ` (${label})` : ""}.
    </p>
  );
}

export function TermsSummary() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Summary</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          {brand.name} is software for owners, managers, staff and invited
          guests. We help you coordinate property work. We do not rent
          properties, broker stays or act as landlord or host.
        </li>
        <li>
          We do not take or process rent, deposits or other stay money. Those
          payments stay between hosts and guests outside the app. Software plans
          (Company / Pro), when live on iOS, are purchased through the Apple App
          Store.
        </li>
        <li>
          Keep your login secure. You are responsible for activity under your
          account and for people you invite.
        </li>
        <li>
          Do not misuse the Service. We may suspend accounts that create risk
          for other users.
        </li>
      </ul>
    </section>
  );
}

export function TermsWhatWeAre() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">
        What {brand.name} is
      </h2>
      <p className="text-muted">
        {brand.name} is a shared ops tool: properties, tasks, jobs, expense
        bills, contacts, team chat, guest stays, house guides, handoff notes,
        maintenance logs, reports and an optional AI agent. It is not a party to
        anyone’s rental or employment relationship.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          We are not a landlord, booking marketplace, escrow, bank, payment
          processor for stays, or employer of your staff.
        </li>
        <li>
          Listing a property or recording a deposit in the app does not mean we
          rent that property or receive money for it.
        </li>
        <li>
          Demo seats are for exploration only. Demo content is sample data you
          cannot edit into your own workspace, and we may reset it at any time.
          Use a real account for your properties and team.
        </li>
      </ul>
    </section>
  );
}

export function TermsRolesOverview() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Roles</h2>
      <p className="text-muted">
        Cleaning and other job types are work labels, not separate account
        roles. Field teammates use the staff seat.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          <strong className="text-ink">Owner</strong>: company settings,
          properties, invites and software billing when live.
        </li>
        <li>
          <strong className="text-ink">Manager</strong>: day-to-day ops with the
          owner. Some company settings stay with the owner.
        </li>
        <li>
          <strong className="text-ink">Staff</strong>: assigned properties,
          tasks, jobs, team chat and expense bills.
        </li>
        <li>
          <strong className="text-ink">Guest</strong>: stay tools, house guide,
          Support with the host and deposit status. No team chat or master ops
          files.
        </li>
        <li>
          <strong className="text-ink">AI agent</strong>: optional helper for
          owners and managers only, scoped to their workspace.
        </li>
      </ul>
    </section>
  );
}

export function TermsMoneySection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Money</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Rent, deposits and stay fees are paid outside {brand.name}. Guests may
          upload a receipt and send{" "}
          <strong className="text-ink">/deposit</strong> so the host can confirm.
          That is a record only.
        </li>
        <li>
          Expense bills in the app are ops records (for example staff submitting
          a receipt). They are not guest checkout.
        </li>
        <li>
          Software subscriptions, when live on iOS, are purchased and managed in
          the Apple App Store. They are never rent or deposit money.
        </li>
      </ul>
    </section>
  );
}

export function TermsGuestSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Guests</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Your host runs the rental and sets price, deposit rules and how you
          pay. {brand.name} helps you request dates, confirm stays, view guides
          and chat in Support.
        </li>
        <li>
          Pay the host directly. Send{" "}
          <strong className="text-ink">/deposit</strong> with a receipt so they
          can confirm.
        </li>
        <li>
          Cancel from Stay home at least 3 days before check-in. Within 3 days,
          send <strong className="text-ink">/cancel</strong> in Support. Your
          host may cancel if a before-arrival deposit stays unpaid.
        </li>
        <li>
          Refunds and house rules are between you and your host. We do not hold
          guest funds or mediate payment disputes.
        </li>
      </ul>
    </section>
  );
}

export function TermsOwnerSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Owners and managers</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          You (not {brand.name}) are responsible for agreements, licensing,
          pricing, collecting money, refunds, taxes and local compliance.
        </li>
        <li>
          Send clear quotes with off-platform payment instructions. Confirm
          deposits only after you receive funds. Keep guides and handoff notes
          accurate; protect access codes.
        </li>
        <li>
          Calendar export links you paste (for example Airbnb or Booking.com)
          are secrets. You authorize us to fetch occupancy. Guests still book
          and pay on that channel. We are not affiliated with those platforms.
        </li>
        <li>
          Vet staff, supervise work and process guest data lawfully. Managers
          share ops access; company settings and some inventory controls stay
          with the owner as configured in the product.
        </li>
      </ul>
    </section>
  );
}

export function TermsStaffSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Staff</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Work on assigned properties and keep status accurate. Submit expense
          bills with receipts when your team requires it.
        </li>
        <li>
          {brand.name} is not your employer. Pay and supervision stay with the
          company that invited you.
        </li>
        <li>
          Talent directory listing is optional and can be turned off. Guest
          Support and deposits are for invited guests, not staff screens.
        </li>
        <li>Staff cannot create an AI agent connection key.</li>
      </ul>
    </section>
  );
}

/** @deprecated Cleaning is not a product role; use TermsStaffSection. */
export function TermsEmployeeSection() {
  return <TermsStaffSection />;
}

export function TermsAgentSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">AI agent</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Only owners and managers may use in-app agent chat or create a
          connection key for an external client.
        </li>
        <li>
          The agent works in your workspace under the key’s scopes. It never
          receives your database password. Revoke a key anytime in Settings.
        </li>
        <li>
          You are responsible for what the agent does while the key is active.
          Check its work before relying on it for codes, money or guest changes.
        </li>
      </ul>
    </section>
  );
}

export function TermsResponsibilitiesSection() {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-bold">Your responsibilities</h2>
      <TermsOwnerSection />
      <TermsStaffSection />
      <TermsGuestSection />
    </section>
  );
}

export function TermsCommonSections({
  includeResponsibilities = true,
}: {
  includeResponsibilities?: boolean;
} = {}) {
  return (
    <>
      <TermsWhatWeAre />
      <TermsRolesOverview />
      <TermsMoneySection />
      {includeResponsibilities ? <TermsResponsibilitiesSection /> : null}
      <TermsAgentSection />

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Your content</h2>
        <p className="text-muted">
          You keep ownership of data you submit. You grant us a limited license
          to host and process it to run and improve the Service. You are
          responsible for its legality and for privacy rules when inviting
          others.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Acceptable use</h2>
        <p className="text-muted">
          Do not reverse engineer the Service except where allowed by law, probe
          or disrupt systems, impersonate others, spam, upload malware, or use
          the Service for unlawful activity. We may remove content or suspend
          accounts that create risk.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Software billing</h2>
        <p className="text-muted">
          Personal workspaces are free for solo use, with no limit on how many
          properties you add. New company workspaces may get a trial of full
          features while billing rolls out. When paid company plans are active,
          the company owner pays: USD 15 / month includes 10 team seats, then
          USD 2 / month for each extra seat. Pro adds USD 9 / month for Connect
          your agent. Managers and field staff are not billed individually. On
          iOS, billing runs through the Apple App Store, which handles the
          charge. Software fees follow App Store refund rules. Referral rewards
          work as described in the app.
        </p>
        <p className="text-muted">
          Founding company offer: the first 10 company workspaces we designate
          as founding (rental companies that create a company workspace during
          the public founding period announced on www.pulseflow.site) receive
          Company plan software access at no monthly Company fee for as long as
          we continue to offer the Company product to that workspace
          (“lifetime” means the remaining commercial life of that product for
          that workspace, not a promise that {brand.name} or any feature will
          exist forever). Included: the Company plan features then generally
          sold for USD 15 / month and the 10 included seats. Not included unless
          we state otherwise in writing: Pro (USD 9 / month), seats beyond 10
          (USD 2 / month each), and any future add-ons. The offer is
          non-transferable, one per company workspace, and does not create
          equity in {brand.name}. If we rename, restructure or replace the
          Company plan, we will move founding workspaces to a successor with
          equal or greater core Company features at no Company monthly fee. If
          we discontinue the Service or the Company product entirely, founding
          access ends; no cash refund is owed for free access.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">
          Disclaimers and liability
        </h2>
        <p className="text-muted">
          The Service is provided “as is”. {brand.name} helps you coordinate; it
          is not legal, tax or insurance advice, and it does not guarantee
          occupancy, staff performance, guest behaviour or payment between hosts
          and guests. To the fullest extent permitted by law, our aggregate
          liability is limited to software fees you paid us in the prior twelve
          months (or USD 100 if you paid none).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Changes</h2>
        <p className="text-muted">
          We may update these Terms, suspend access for breach or risk, or
          discontinue features. Continued use after we post a new “Last updated”
          date means you accept the update.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Governing law</h2>
        <p className="text-muted">
          These Terms are governed by the laws of Thailand, except where
          mandatory local rights apply. Courts in Thailand have non-exclusive
          jurisdiction, subject to those rights. {brand.name} operates primarily
          in Thailand; you remain responsible for local rental law wherever your
          property sits.
        </p>
      </section>
    </>
  );
}

export function PrivacySummary() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Summary</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          We collect the account, operations and technical data needed to run
          the Service. We do not take or process rent or deposit payments.
        </li>
        <li>
          We use it to sign you in, provide features, send the notifications you
          enable, keep the Service secure and improve it.
        </li>
        <li>
          We share it with infrastructure providers, with teammates according to
          their role, with an AI agent you connect yourself, with Apple for App
          Store subscriptions once billing is enabled, and with authorities when
          the law requires.
        </li>
        <li>
          We do not sell personal information, and we do not share it with
          advertisers.
        </li>
      </ul>
    </section>
  );
}

export function PrivacyWhoCanSeeSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Who can see what</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Owners and managers can see the data in their company workspace,
          including staff work and bills, guest stays, Support chat and deposit
          records.
        </li>
        <li>
          Staff can see their profile, assigned properties, tasks, jobs, team
          chat and the bills they submit. Receipt and property photos you upload
          are stored in cloud storage.
        </li>
        <li>
          Guests can see their own stay, house guide, briefings, deposit record
          and Support chat with their host. Their host and the host’s authorized
          team can see this data. Other guests cannot.
        </li>
        <li>
          Talent directory: if staff opt in, owners and managers searching in
          the app can see their listing, skills, location and reputation data.
        </li>
        <li>
          Invites: when you invite someone, we store the invite and join record
          tied to your company.
        </li>
      </ul>
    </section>
  );
}

export function PrivacyGuestSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Stay guests</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Guests can see their own stay, house guide, briefings, deposit record
          and Support chat with their host. Their host and the host’s authorized
          team can see this data. Other guests cannot.
        </li>
        <li>
          A deposit is a record only. We do not collect card numbers for rent or
          deposits.
        </li>
      </ul>
    </section>
  );
}

export function PrivacyOwnerSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Owners & managers</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Owners and managers can see the data in their company workspace,
          including staff work and bills, guest stays, Support chat and deposit
          records.
        </li>
        <li>
          When you invite someone, we store the invite and join record tied to
          your company.
        </li>
        <li>
          When App Store billing is enabled, we store subscription details on
          the organization, such as product and expiry date. Payment card
          details stay with Apple.
        </li>
      </ul>
    </section>
  );
}

export function PrivacyStaffSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Staff</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Staff can see their profile, assigned properties, tasks, jobs, team
          chat and the bills they submit. Receipt and property photos you upload
          are stored in cloud storage.
        </li>
        <li>
          Talent directory: if staff opt in, owners and managers searching in
          the app can see their listing, skills, location and reputation data.
        </li>
        <li>
          Staff do not receive AI agent connection keys; only owners and
          managers can create them.
        </li>
      </ul>
    </section>
  );
}

/** @deprecated Cleaning is not a product role; use PrivacyStaffSection. */
export function PrivacyEmployeeSection() {
  return <PrivacyStaffSection />;
}

export function PrivacyCommonSections({
  includeWhoCanSee = true,
}: {
  includeWhoCanSee?: boolean;
} = {}) {
  return (
    <>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">What we collect</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>
            Account data: name, email, role, organization and optional profile
            details.
          </li>
          <li>
            Operations data: properties (including photos and listing links),
            tasks, jobs, contacts, team chat, expense bills and receipts,
            reports, guest stays, house guides, property details and access
            information, maintenance logs, and optional calendar-export links
            and imported occupancy.
          </li>
          <li>
            Guest stay data: date requests, quotes, confirmed stays, deposit
            status, briefings, house-guide views and Support chat. A deposit is
            a record only. We do not collect card numbers for rent or deposits.
          </li>
          <li>
            Technical data: device and browser type, IP address, app version,
            log events and the session cookies that keep you signed in.
          </li>
          <li>
            Optional data: push notification tokens if you enable notifications,
            and cookies used by the public demo.
          </li>
          <li>
            Agent data: if you use Connect your agent, we store a hash of your
            connection key, its label and scopes, and a log of the agent’s
            activity in your workspace.
          </li>
          <li>
            Subscription data: when App Store billing is enabled, we store
            subscription details on the organization, such as product and expiry
            date. Payment card details stay with Apple.
          </li>
        </ul>
      </section>

      {includeWhoCanSee ? <PrivacyWhoCanSeeSection /> : null}

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">How we use data</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>Sign you in and enforce role-based access</li>
          <li>
            Provide the features you use and keep workspaces separate from each
            other
          </li>
          <li>Send the notifications you enable</li>
          <li>
            Detect abuse, secure accounts and keep the Service reliable
          </li>
          <li>
            Improve the product using aggregated or de-identified insights
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">
          Cookies and local storage
        </h2>
        <p className="text-muted">
          We use essential cookies and local storage for sign-in, language
          preference and demo mode. We do not use third-party advertising
          cookies. Blocking essential cookies may stop you from signing in.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Service providers</h2>
        <p className="text-muted">
          We use processors to run the Service: cloud hosting and content
          delivery (for example Vercel), database and authentication (for
          example Supabase), file storage for photos and receipts, email
          delivery, and Apple for paid subscriptions through the App Store when
          billing is enabled. They process data only to provide their services
          to us.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">AI agent</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>
            Only owners and managers can create connection keys. Staff and
            guests cannot.
          </li>
          <li>
            We store a hash of the key, a label, its scopes and usage metadata.
            The full key is shown once, when you create it.
          </li>
          <li>
            When the agent calls {brand.name}, we process only the operational
            data its tools read or write, within your workspace and the scopes
            you granted. It cannot reach other companies’ workspaces, take guest
            payments or obtain our database credentials.
          </li>
          <li>
            You can revoke a key at any time in Settings. A revoked key stops
            working.
          </li>
          <li>
            Check the agent’s work before you rely on it for anything sensitive,
            such as access codes, money or guest changes.
          </li>
          <li>
            The AI client you connect, such as your code editor or desktop
            assistant, processes your prompts on its own systems under its own
            privacy terms. Choose providers you trust.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">
          Retention and security
        </h2>
        <p className="text-muted">
          We keep data while your organization is active and for a reasonable
          period afterward for backups, dispute handling and legal compliance.
          We use HTTPS, access controls and role-based views, so guests, staff
          and owners do not see each other’s private channels by default. No
          method is completely secure: use strong passwords or passkeys, limit
          invites, and protect your access codes and connection keys.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">
          Your choices and requests
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>Update your profile and organization settings in the app.</li>
          <li>Revoke agent connection keys in Settings.</li>
          <li>
            Manage company subscriptions in the App Store (Subscriptions) once
            iOS billing is live.
          </li>
          <li>
            To access, correct, export or delete your account or personal data,
            email{" "}
            <a
              className="font-semibold text-primary"
              href={`mailto:${brand.supportEmail}`}
            >
              {brand.supportEmail}
            </a>
            . We may need to verify your identity and keep limited records the
            law requires.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">
          International use and children
        </h2>
        <p className="text-muted">
          {brand.name} operates primarily in Thailand, where the demo launch is
          focused. Our providers may process data in other regions. The Service
          is for business and property operations and is not directed at
          children under 16. Do not create an account for a child under 16.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Changes</h2>
        <p className="text-muted">
          We may update this policy and will post a new “Last updated” date.
          Continued use means you accept the update.
        </p>
      </section>
    </>
  );
}

export function AudienceSections({
  audience,
  kind,
}: {
  audience: LegalAudience;
  kind: "terms" | "privacy";
}) {
  if (audience === "all") {
    // Full docs embed role sections inside Common / Responsibilities.
    return null;
  }

  if (kind === "terms") {
    switch (audience) {
      case "guest":
        return <TermsGuestSection />;
      case "owner":
        return <TermsOwnerSection />;
      case "staff":
        return <TermsStaffSection />;
      case "agent":
        return <TermsAgentSection />;
      default:
        return null;
    }
  }

  switch (audience) {
    case "guest":
      return <PrivacyGuestSection />;
    case "owner":
      return <PrivacyOwnerSection />;
    case "staff":
      return <PrivacyStaffSection />;
    case "agent":
      return null;
    default:
      return null;
  }
}

export function LegalDocumentFooter({
  audience,
  kind,
}: {
  audience: LegalAudience;
  kind: "terms" | "privacy";
}) {
  const other = kind === "terms" ? "/privacy" : "/terms";
  const otherLabel =
    kind === "terms" ? "Privacy Policy" : "Terms of Service";

  return (
    <>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Operator and contact</h2>
        <p className="text-muted">
          {brand.name} operates{" "}
          <a
            className="font-semibold text-primary"
            href="https://app.pulseflow.site"
          >
            app.pulseflow.site
          </a>{" "}
          and{" "}
          <a
            className="font-semibold text-primary"
            href="https://www.pulseflow.site"
          >
            www.pulseflow.site
          </a>
          . For {kind === "privacy" ? "privacy requests, " : ""}
          legal notices or questions:{" "}
          <a
            className="font-semibold text-primary"
            href={`mailto:${brand.supportEmail}`}
          >
            {brand.supportEmail}
          </a>
          . See also our{" "}
          <Link
            href={legalPageHref(other, audience)}
            className="font-semibold text-primary"
          >
            {otherLabel}
          </Link>
          .
        </p>
      </section>

      <div className="flex flex-wrap gap-4 pt-2 pb-8">
        <Link
          href={legalPageHref(other, audience)}
          className="font-semibold text-primary"
        >
          {otherLabel}
        </Link>
        {audience !== "all" ? (
          <Link
            href={legalPageHref(kind === "terms" ? "/terms" : "/privacy", "all")}
            className="font-semibold text-primary"
          >
            Full {kind === "terms" ? "Terms" : "Privacy"} (all roles)
          </Link>
        ) : null}
        <Link href="/settings" className="font-semibold text-primary">
          Settings
        </Link>
        <Link href="/login" className="font-semibold text-muted">
          Sign in
        </Link>
      </div>
    </>
  );
}
