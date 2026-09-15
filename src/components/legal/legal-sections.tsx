import Link from "next/link";
import { brand } from "@/lib/design-tokens";
import {
  type LegalAudience,
  legalPageHref,
} from "@/lib/legal/audiences";

/** Bump when Terms or Privacy substantive text changes. */
export const LEGAL_LAST_UPDATED = "15 September 2026";

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
        : audience === "employee"
          ? "cleaning team members"
          : audience === "staff"
            ? "field staff"
            : "all users";

  if (kind === "terms") {
    return (
      <p className="text-muted">
        These Terms govern your use of {brand.name} (the “Service”), including{" "}
        <a
          className="font-semibold text-primary"
          href="https://app.pulseflow.site"
        >
          app.pulseflow.site
        </a>
        ,{" "}
        <a
          className="font-semibold text-primary"
          href="https://pulseflow.site"
        >
          pulseflow.site
        </a>
        , and related sites or apps. By creating an account or using the Service
        as {label}, you agree to these Terms.
      </p>
    );
  }

  return (
    <p className="text-muted">
      This Privacy Policy explains how {brand.name} collects, uses, and shares
      information when you use{" "}
      <a
        className="font-semibold text-primary"
        href="https://app.pulseflow.site"
      >
        app.pulseflow.site
      </a>
      ,{" "}
      <a className="font-semibold text-primary" href="https://pulseflow.site">
        pulseflow.site
      </a>
      , and related sites or apps (the “Service”) as {label}.
    </p>
  );
}

export function TermsSummary() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Summary</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          {brand.name} is operations software for properties that are rented,
          managed, and maintained. It is not a landlord, employer, payment
          processor, escrow, insurer, or travel agency.
        </li>
        <li>
          Keep your login secure and use accurate registration details. You are
          responsible for activity under your account.
        </li>
        <li>
          Personal workspaces are for solo use. Company workspaces support teams;
          company billing applies to the company owner when paid plans are
          active.
        </li>
        <li>
          Do not misuse chat, upload harmful or unlawful content, scrape the
          Service, or process data you are not authorized to handle.
        </li>
        <li>
          We may update these Terms and suspend accounts that create risk for
          other users or the Service.
        </li>
      </ul>
    </section>
  );
}

export function TermsGuestSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">
        Guest stays & your host
      </h2>
      <p className="text-muted">
        If you were invited as a stay guest, your host (the property owner or
        manager) runs the rental. {brand.name} helps you request dates, receive
        quotes, confirm stays, view briefings, chat in Support, and track
        deposits. Your host sets price, deposit rules, and payment instructions.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          <strong className="text-ink">Quotes:</strong> submit dates and a note;
          your host sends a total price, optional deposit, timing, and how to
          pay.
        </li>
        <li>
          <strong className="text-ink">Deposits:</strong> paid directly to your
          host outside the app. Open Support, send{" "}
          <strong className="text-ink">/deposit</strong>, and attach a receipt;
          your host confirms when received.
        </li>
        <li>
          <strong className="text-ink">Cancellation:</strong> at least 3 days
          before check-in you may cancel from Stay home. Within 3 days, send{" "}
          <strong className="text-ink">/cancel</strong> in Support to request
          cancellation from your host.
        </li>
        <li>
          <strong className="text-ink">Host cancellation:</strong> your host may
          cancel a confirmed stay from their Guests panel. If a before-arrival
          deposit stays unpaid or unconfirmed, they may cancel to protect the
          booking.
        </li>
        <li>
          Refunds, house rules, and local rental law are between you and your
          host. {brand.name} does not hold guest payments or mediate disputes.
        </li>
      </ul>
    </section>
  );
}

export function TermsOwnerSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Owners & managers</h2>
      <p className="text-muted">
        You operate properties (homes, offices, and other rentable units), invite
        team members and stay guests, and are responsible for rental or lease
        agreements, pricing, deposits, refunds, and local compliance.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Respond to date requests with clear quotes, deposit timing, and payment
          instructions. Confirm deposits in Guests or Support after checking
          receipts.
        </li>
        <li>
          Send briefings, manage confirmed stays, and cancel bookings from Guests
          when needed. Notify guests through the app.
        </li>
        <li>
          Guest-to-host payments happen off-platform. Document what guests paid;
          they see deposits under Bills.
        </li>
        <li>
          You may cancel if a before-arrival deposit remains unpaid or
          unconfirmed.
        </li>
        <li>
          You are responsible for vetting staff, supervising work, and lawful
          processing of guest and team data you store in the Service.
        </li>
        <li>
          Company billing, when live, is your responsibility as company owner.
          Managers and field staff are not billed personally.
        </li>
      </ul>
    </section>
  );
}

export function TermsEmployeeSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Cleaning team</h2>
      <p className="text-muted">
        If you join as cleaning team (cleaner role), you use the field app for
        assigned properties, jobs, and expense bills. Your employer or client
        (the company owner or manager) sets access and work expectations.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Complete assigned jobs and update property status only for properties
          you are allowed to access.
        </li>
        <li>
          Submit bills and receipts for work-related expenses according to your
          team’s rules.
        </li>
        <li>
          Team chat, endorsements, and the talent directory are optional company
          features controlled by you and your organization.
        </li>
        <li>
          {brand.name} is not your employer. Pay, supervision, and safety on site
          are between you and the property team that invited you.
        </li>
        <li>
          Do not share guest stay Support messages or host payment details; guest
          chat is separate from team chat.
        </li>
      </ul>
    </section>
  );
}

export function TermsStaffSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Field staff</h2>
      <p className="text-muted">
        If you join as staff, you use the field app for assigned properties,
        tasks, jobs, team chat, and bills. Your company owner or manager controls
        invites, property access, and work assignments.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Work only on properties and tasks assigned to you. Confirm jobs and
          keep status updates accurate for your team.
        </li>
        <li>
          Submit expenses with clear descriptions and receipts when your team
          requires them.
        </li>
        <li>
          You may opt into the talent directory and public reputation pages in
          Settings; listing is voluntary.
        </li>
        <li>
          {brand.name} coordinates operations but is not your employer and is
          not a party to any work contract with the property team.
        </li>
        <li>
          Guest stay tools (Support, deposits, briefings) are for invited guests,
          not your daily staff screens.
        </li>
      </ul>
    </section>
  );
}

export function TermsCommonSections() {
  return (
    <>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Your content & data</h2>
        <p className="text-muted">
          You retain ownership of properties, tasks, contacts, messages, bills,
          photos, and other data you submit. You grant us a limited license to
          host and process it to operate, secure, and improve the Service. You
          are responsible for its legality and for privacy and employment rules
          when inviting others.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Acceptable use</h2>
        <p className="text-muted">
          You may not reverse engineer the Service except where allowed by law,
          probe or disrupt systems, impersonate others, spam, upload malware, or
          use the Service for unlawful activity. We may remove content or suspend
          accounts that violate these rules.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Billing & referrals</h2>
        <p className="text-muted">
          New company workspaces receive about 90 days (roughly 3 months) of full
          features while billing is rolling out. Personal workspaces stay free for
          solo use. When paid company plans are active, company owners subscribe
          through Stripe for gated company features; referral rewards may unlock
          extended Full access as described in the app. Fees are non-refundable
          except where required by law or stated in a written offer.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Disclaimers & liability</h2>
        <p className="text-muted">
          The Service is provided “as is”. {brand.name} coordinates operations; it
          is not legal, tax, accounting, or insurance advice, and it does not
          guarantee occupancy, staff performance, or payment between hosts and
          guests. To the fullest extent permitted by law, our aggregate liability
          for claims relating to the Service is limited to the fees you paid us
          for the Service in the prior twelve months (or USD 100 if you paid
          none).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Changes & termination</h2>
        <p className="text-muted">
          We may update these Terms, suspend access for breach or risk, or
          discontinue features. You may stop using the Service at any time.
          Continued use after we post changes means you accept the updated Terms.
          We will show a revised “Last updated” date on this page.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Governing law</h2>
        <p className="text-muted">
          These Terms are governed by the laws of Thailand, without regard to
          conflict-of-law rules, except where mandatory consumer or local law
          gives you non-waivable rights. Courts in Thailand have non-exclusive
          jurisdiction, subject to those mandatory rights.
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
          We collect account, operations, and technical data needed to run the
          Service.
        </li>
        <li>
          We use data to authenticate you, deliver features, send notifications,
          secure the Service, and improve the product.
        </li>
        <li>
          We share data with infrastructure providers (for example hosting,
          database, and email), Stripe when billing is enabled, teammates
          according to role, and authorities when required by law.
        </li>
        <li>We do not sell your personal information.</li>
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
          We store date requests, quotes, confirmed stays, deposit status,
          briefings, and Support chat for your stay (including{" "}
          <strong className="text-ink">/deposit</strong> and{" "}
          <strong className="text-ink">/cancel</strong> messages).
        </li>
        <li>
          Receipt images you attach in Support are stored in our cloud storage.
        </li>
        <li>
          Your host and their property team can see booking and Support data for
          your stay. Other guests cannot.
        </li>
        <li>
          Push notifications may alert you to booking, deposit, and briefing
          updates if you enable them.
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
          We process property inventory, tasks, contacts, team chat, bills,
          reports, guest stays, and company billing metadata for your
          organization.
        </li>
        <li>
          When you invite staff or guests, we store invite and join records tied
          to your company.
        </li>
        <li>
          Guest Support messages, deposit records, and stay data are visible to
          authorized owners and managers in your workspace.
        </li>
        <li>
          Stripe customer and subscription IDs are stored on the organization when
          billing is enabled; card numbers are handled by Stripe, not by us.
        </li>
      </ul>
    </section>
  );
}

export function PrivacyEmployeeSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Cleaning team</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          We store your profile, assigned properties, job confirmations, and bills
          you submit for your organization.
        </li>
        <li>
          Receipt photos you upload for expenses are stored in cloud storage.
        </li>
        <li>
          Owners and managers in your company can see work and bill data according
          to role permissions.
        </li>
        <li>
          Guest stay Support chat and deposit receipts are not part of your staff
          workflow unless you are also invited as a guest separately.
        </li>
      </ul>
    </section>
  );
}

export function PrivacyStaffSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Field staff</h2>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          We store your profile, tasks, jobs, team chat messages, endorsements,
          and submitted bills.
        </li>
        <li>
          If you opt into the talent directory, owners and managers searching in
          the app may see your listing, skills, location, and reputation data.
        </li>
        <li>
          Property photos and bill receipts you upload are stored in cloud
          storage.
        </li>
        <li>
          Teammates in your company see operational data according to role; guest
          stay data remains limited to hosts and that guest.
        </li>
      </ul>
    </section>
  );
}

export function PrivacyCommonSections() {
  return (
    <>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">
          What we collect
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>
            Account data: name, email, role, organization, and optional profile
            fields you enter.
          </li>
          <li>
            Operations data: properties, tasks, jobs, contacts, bills, messages,
            photos, guest stays, and related records you or your teammates create.
          </li>
          <li>
            Technical data: device and browser type, IP address, app version, log
            events, and session cookies needed to keep you signed in.
          </li>
          <li>
            Optional push subscription tokens if you enable notifications, and
            demo-session cookies when you use public demo seats.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">
          Cookies & local storage
        </h2>
        <p className="text-muted">
          We use essential cookies and local storage for authentication, language
          preference, and (when used) demo mode. We do not use third-party
          advertising cookies. Disabling essential cookies may prevent sign-in.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Service providers</h2>
        <p className="text-muted">
          We use trusted processors to run the Service, including cloud hosting
          and content delivery (for example Vercel), database and authentication
          (for example Supabase), file storage for photos and receipts, email
          delivery, and Stripe for paid company subscriptions when billing is
          enabled. Providers process data only to provide their services to us.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Retention & security</h2>
        <p className="text-muted">
          We retain data while your organization is active and for a reasonable
          period afterward for backups, dispute handling, and legal compliance.
          We use encrypted transport (HTTPS) and access controls. No method is
          100% secure; use strong passwords and limit invites.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Your choices & requests</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>Update profile and organization settings in the app</li>
          <li>Manage company billing via the billing portal when available</li>
          <li>
            Email{" "}
            <a
              className="font-semibold text-primary"
              href={`mailto:${brand.supportEmail}`}
            >
              {brand.supportEmail}
            </a>{" "}
            to access, correct, export, or request deletion of your account or
            personal data where applicable. We may need to verify your identity
            and keep limited records required by law.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">
          International use & children
        </h2>
        <p className="text-muted">
          Data may be processed outside your home country through our providers.
          The Service is for business and rental operations and is not directed at
          children under 16. Do not create an account for a child under 16.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Changes</h2>
        <p className="text-muted">
          We may update this Policy and post a revised “Last updated” date on this
          page. Continued use means you accept the updated Policy.
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
    return (
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold">By role</h2>
        {kind === "terms" ? (
          <>
            <TermsGuestSection />
            <TermsOwnerSection />
            <TermsEmployeeSection />
            <TermsStaffSection />
          </>
        ) : (
          <>
            <PrivacyGuestSection />
            <PrivacyOwnerSection />
            <PrivacyEmployeeSection />
            <PrivacyStaffSection />
          </>
        )}
      </section>
    );
  }

  if (kind === "terms") {
    switch (audience) {
      case "guest":
        return <TermsGuestSection />;
      case "owner":
        return <TermsOwnerSection />;
      case "employee":
        return <TermsEmployeeSection />;
      case "staff":
        return <TermsStaffSection />;
      default:
        return null;
    }
  }

  switch (audience) {
    case "guest":
      return <PrivacyGuestSection />;
    case "owner":
      return <PrivacyOwnerSection />;
    case "employee":
      return <PrivacyEmployeeSection />;
    case "staff":
      return <PrivacyStaffSection />;
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
        <h2 className="font-display text-lg font-bold">Operator & contact</h2>
        <p className="text-muted">
          The Service is operated under the {brand.name} brand at{" "}
          <a
            className="font-semibold text-primary"
            href="https://pulseflow.site"
          >
            pulseflow.site
          </a>{" "}
          and{" "}
          <a
            className="font-semibold text-primary"
            href="https://app.pulseflow.site"
          >
            app.pulseflow.site
          </a>
          . Legal notices, privacy requests, and questions:{" "}
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
