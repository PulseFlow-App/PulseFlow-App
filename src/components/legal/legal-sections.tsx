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
export const LEGAL_LAST_UPDATED = "26 October 2026";

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
          href="https://www.pulseflow.site"
        >
          www.pulseflow.site
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
      <a
        className="font-semibold text-primary"
        href="https://www.pulseflow.site"
      >
        www.pulseflow.site
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
          {brand.name} is a digital helper for property operations: owners,
          managers, field staff, cleaners, vendors, and stay guests. We help
          teams coordinate work and information. We do{" "}
          <strong className="text-ink">not</strong> rent properties, broker
          stays, act as a landlord or host, or provide hospitality services
          ourselves.
        </li>
        <li>
          We never collect, hold, or process rent, deposits, guest stay fees, or
          other money paid for a property. Those payments stay between hosts and
          guests (or employers and staff) outside the app. Any paid plan we
          offer is only for software access (Company / Pro), not for property
          bookings.
        </li>
        <li>
          We currently operate the Service with a focus on Thailand. A public
          demo is launching in Thailand (including Koh Phangan). Features may
          expand to other regions later; local rental law always remains your
          responsibility.
        </li>
        <li>
          Keep your login secure. You are responsible for activity under your
          account and for data you invite others to see.
        </li>
        <li>
          Do not misuse chat, upload harmful or unlawful content, scrape the
          Service, or process data you are not authorized to handle. We may
          suspend accounts that create risk for other users.
        </li>
      </ul>
    </section>
  );
}

function TermsWhatWeAre() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">
        What {brand.name} is - and is not
      </h2>
      <p className="text-muted">
        {brand.name} is software that helps all sides of property operations stay
        aligned: status, tasks, jobs, bills for work expenses, contacts, team
        chat, guest stay coordination, house guides, master handoff notes,
        maintenance logs, reports, reputation tools, and optional AI agent
        helpers. Think of us as a shared notebook and workflow tool - not as a
        party to anyone’s rental or employment relationship.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          <strong className="text-ink">We are:</strong> a software platform and
          helper for owners, managers, cleaning teams, field staff, vendors
          invited into workflows, and stay guests invited by a host.
        </li>
        <li>
          <strong className="text-ink">We are not:</strong> a landlord, property
          manager, travel agency, booking marketplace, escrow, insurer, bank,
          payment processor for stays, employer of your staff, or provider of
          on-site rental or cleaning services.
        </li>
        <li>
          Listing a property, inviting a guest, or recording a deposit in the
          app does <strong className="text-ink">not</strong> mean {brand.name}{" "}
          is renting that property or receiving money for it.
        </li>
      </ul>
    </section>
  );
}

function TermsThailandAndDemo() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">
        Thailand focus & public demo
      </h2>
      <p className="text-muted">
        The Service is operated with Thailand as the primary launch market. Our
        public demo accounts and soft launch activities are aimed at users in
        Thailand (including Koh Phangan and nearby areas). You may still create
        an account from elsewhere, but support, content examples, and rollout
        priorities currently centre on Thailand. You remain solely responsible
        for complying with Thai law and any other law that applies to your
        properties, guests, and staff.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Demo seats are for exploration. Demo data can be reset; do not put
          real secrets or production credentials only into demo.
        </li>
        <li>
          Real accounts are for your own operations. You control who you invite
          and what they can see.
        </li>
      </ul>
    </section>
  );
}

function TermsNoPropertyPayments() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">
        No payments for properties or stays
      </h2>
      <p className="text-muted">
        {brand.name} does not accept, route, hold, or refund money for rent,
        guest stays, security deposits, damage claims, vendor invoices for
        property work paid by guests, or similar property-related transfers.
        Hosts tell guests how to pay (bank transfer, cash, or other methods
        outside the Service). Guests may upload receipt photos and use Support
        commands such as <strong className="text-ink">/deposit</strong> so the
        host can confirm receipt - that is record-keeping only.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Expense “bills” inside the app are operational records (for example a
          cleaner submitting a receipt to an owner). They are not card checkout
          for guests paying for a stay.
        </li>
        <li>
          If we charge fees, they are only for software subscriptions (for
          example Company Full or Pro / Connect your agent), processed by a
          payment provider such as Stripe. Those fees are never rent or deposit
          money.
        </li>
      </ul>
    </section>
  );
}

function TermsFeaturesSafety() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">
        Features & how we keep you safer
      </h2>
      <p className="text-muted">
        Depending on your role and plan, the Service may include property
        inventory with photos and details; quick-fill from listing links or
        notes; stay dates and status; a bookings calendar; optional import of
        occupancy from third-party calendar export links (for example Airbnb,
        Booking.com, or VRBO iCal feeds you paste); download of service jobs as
        calendar files; team assignment; tasks and service jobs; contacts; team
        chat; guest Support chat; house guides for guests; master info handoff
        files for the ops team; maintenance logs; reports and exports;
        endorsements and talent search; push notifications; passkeys; and
        optional Connect your agent (in-app chat or an external MCP client with
        a connection key).
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Access is role-based. Guests do not see team chat or master ops files.
          Staff see assigned work, not every company secret by default.
        </li>
        <li>
          Master info and similar handoff notes are for your internal team. You
          decide whether managers may view a property’s master file.
        </li>
        <li>
          Calendar import uses private export links you provide. Those feeds are
          not a booking engine or payment channel. Treat feed URLs as secrets;
          anyone with the link may read blocked or reserved nights. Pulse Flow
          is not affiliated with Airbnb, Booking.com, or VRBO and does not
          replace their listings or guest checkout.
        </li>
        <li>
          Agent connection keys never include your database password. You can
          revoke a key anytime. You remain responsible for actions taken with an
          active key.
        </li>
        <li>
          We use encrypted transport (HTTPS), authenticated sessions, and
          provider access controls. No system is perfectly secure - use strong
          passwords or passkeys, and invite only people you trust.
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
        manager) runs the rental. {brand.name} only helps you request dates,
        receive quotes, confirm stays, view house guides and briefings, chat in
        Support, and track deposit status. Your host - not {brand.name} - sets
        price, deposit rules, house rules, and how you pay.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          <strong className="text-ink">Quotes:</strong> submit dates and a note;
          your host sends a total price, optional deposit, timing, and how to
          pay outside the app.
        </li>
        <li>
          <strong className="text-ink">Deposits & stay money:</strong> paid
          directly to your host. {brand.name} never receives that money. Open
          Support, send <strong className="text-ink">/deposit</strong>, and
          attach a receipt so your host can confirm.
        </li>
        <li>
          <strong className="text-ink">Cancellation:</strong> at least 3 days
          before check-in you may cancel from Stay home. Within 3 days, send{" "}
          <strong className="text-ink">/cancel</strong> in Support to request
          cancellation from your host.
        </li>
        <li>
          <strong className="text-ink">Host cancellation:</strong> your host may
          cancel a confirmed stay. If a before-arrival deposit stays unpaid or
          unconfirmed, they may cancel to protect the booking.
        </li>
        <li>
          Refunds, disputes, and local rental law are between you and your host.
          {brand.name} does not mediate payment disputes or hold guest funds.
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
        You operate properties and invite teammates and stay guests. You - not{" "}
        {brand.name} - are responsible for rental or lease agreements, licensing,
        pricing, collecting deposits and rent, refunds, taxes, and local
        compliance in Thailand or wherever your property sits.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Respond to date requests with clear quotes, deposit timing, and
          off-platform payment instructions. Confirm deposits after you actually
          receive funds.
        </li>
        <li>
          Keep house guides accurate for guests. Use master info, maintenance
          logs, and reports for internal handoffs - treat sensitive codes as
          confidential.
        </li>
        <li>
          If you connect a third-party calendar export (Airbnb, Booking.com,
          VRBO, or similar), you authorize {brand.name} to fetch that feed and
          show occupancy blocks in your workspace. You are responsible for
          keeping the link private, for the accuracy of dates on the source
          platform, and for double-booking risk if feeds are stale or incomplete.
          Guests still book and pay on the channel; {brand.name} does not process
          those bookings or channel fees.
        </li>
        <li>
          Guest-to-host payments happen outside {brand.name}. Document what
          guests paid; guests may see deposit status under Bills.
        </li>
        <li>
          You are responsible for vetting staff, supervising work, and lawful
          processing of guest and team data you store.
        </li>
        <li>
          Company software billing (when live) is the company owner’s
          responsibility: USD 15 / month includes 10 team seats, then USD 2 /
          month per extra seat. Pro adds USD 9 / month. Managers and field
          staff are not billed individually.
        </li>
        <li>
          Managers typically share operational access with owners, except
          organisation settings, full company property inventory edits, and
          property access assignment, as configured in the product.
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
        (the company owner or manager) sets access and work expectations.{" "}
        {brand.name} only helps coordinate that work.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Complete assigned jobs and update status only for properties you may
          access.
        </li>
        <li>
          Submit bills and receipts for work-related expenses according to your
          team’s rules. Those are ops records - not guest stay payments.
        </li>
        <li>
          Team chat, endorsements, and the talent directory are optional company
          features.
        </li>
        <li>
          {brand.name} is not your employer. Pay, supervision, and site safety
          are between you and the property team that invited you.
        </li>
        <li>
          Do not share guest Support messages or host payment details; guest
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
        tasks, jobs, team chat, and bills. Your company owner or manager
        controls invites, property access, and assignments. {brand.name} is a
        helper for that coordination - not a party to your work contract.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Work only on properties and tasks assigned to you. Keep status updates
          accurate.
        </li>
        <li>
          Submit expenses with clear descriptions and receipts when required.
        </li>
        <li>
          You may opt into the talent directory and public reputation pages;
          listing is voluntary and can be turned off.
        </li>
        <li>
          Guest stay tools (Support, deposits, briefings) are for invited
          guests, not your daily staff screens.
        </li>
      </ul>
    </section>
  );
}

function TermsAgentSection() {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold">Connect your agent</h2>
      <p className="text-muted">
        Owners and managers may use in-app agent chat or connect an external
        agent (for example via an MCP client) with a personal connection key
        created in Settings. Agents can help with operational tasks in your
        workspace; they never receive your database credentials.
      </p>
      <ul className="list-disc space-y-1 pl-5 text-muted">
        <li>
          Typical capabilities include reading team, properties, tasks, jobs,
          and bills; creating tasks and jobs; adding a property; updating house
          guide fields; and marking a task done - only in your current
          workspace and within the key’s scopes.
        </li>
        <li>
          Field staff and stay guests cannot create a connection key or use
          owner agent chat.
        </li>
        <li>
          You are responsible for actions taken while a key is active. Keep keys
          secret, revoke them anytime, and review agent output before relying on
          it.
        </li>
        <li>
          Pro / Connect your agent adds USD 9 / month on Personal or Company
          when billing is live. That fee is for software access only.
        </li>
      </ul>
    </section>
  );
}

export function TermsCommonSections() {
  return (
    <>
      <TermsWhatWeAre />
      <TermsThailandAndDemo />
      <TermsNoPropertyPayments />
      <TermsFeaturesSafety />
      <TermsAgentSection />

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Your content & data</h2>
        <p className="text-muted">
          You retain ownership of properties, tasks, contacts, messages, bills,
          photos, house guides, master info, maintenance logs, and other data
          you submit. You grant us a limited license to host and process it to
          operate, secure, and improve the Service. You are responsible for its
          legality and for privacy and employment rules when inviting others.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Acceptable use</h2>
        <p className="text-muted">
          You may not reverse engineer the Service except where allowed by law,
          probe or disrupt systems, impersonate others, spam, upload malware, or
          use the Service for unlawful activity (including facilitating illegal
          rentals or fraud). We may remove content or suspend accounts that
          violate these rules or put other users at risk.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">
          Software billing & referrals
        </h2>
        <p className="text-muted">
          Personal workspaces stay free for solo use. New company workspaces may
          receive a trial of full features while billing rolls out. When paid
          company plans are active, company owners subscribe through a payment
          provider (for example Stripe) for gated company software features  - 
          never for guest stay money. Referral rewards may unlock extended Full
          access as described in the app. Software fees are non-refundable
          except where required by law or stated in a written offer.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Disclaimers & liability</h2>
        <p className="text-muted">
          The Service is provided “as is”. {brand.name} helps you coordinate; it
          is not legal, tax, accounting, or insurance advice, and it does not
          guarantee occupancy, staff performance, guest behaviour, or payment
          between hosts and guests. We do not verify that a listing is licensed
          or that a stay is lawful. To the fullest extent permitted by law, our
          aggregate liability for claims relating to the Service is limited to
          the software fees you paid us in the prior twelve months (or USD 100
          if you paid none).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Changes & termination</h2>
        <p className="text-muted">
          We may update these Terms, suspend access for breach or risk, or
          discontinue features. You may stop using the Service at any time.
          Continued use after we post changes means you accept the updated
          Terms. We will show a revised “Last updated” date on this page.
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
          We collect account, operations, and technical data needed to run a
          safe helper platform for property teams and invited guests - not to
          process rent or deposit payments.
        </li>
        <li>
          We use data to authenticate you, deliver features (including house
          guides, master info, reports, chat, and optional agents), send
          notifications, secure the Service, and improve the product.
        </li>
        <li>
          We share data with infrastructure providers (hosting, database, email,
          file storage), Stripe only when software billing is enabled, teammates
          according to role, an agent you connect with your key, and authorities
          when required by law.
        </li>
        <li>
          We do not sell your personal information. We do not sell guest or
          property data to advertisers.
        </li>
        <li>
          Primary operations and demo launch focus on Thailand; data may still
          be processed in regions where our providers operate.
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
          We store date requests, quotes, confirmed stays, deposit status
          (record only - not card data for the stay), briefings, house-guide
          views, and Support chat (including{" "}
          <strong className="text-ink">/deposit</strong> and{" "}
          <strong className="text-ink">/cancel</strong>).
        </li>
        <li>
          Receipt images you attach in Support are stored in our cloud storage so
          your host can confirm payment they received outside the app.
        </li>
        <li>
          Your host and their authorized property team can see booking and
          Support data for your stay. Other guests cannot.
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
          We process property inventory (including photos, listing links, and
          details), optional calendar-export URLs and imported occupancy blocks,
          tasks, jobs, contacts, team chat, expense bills, reports and handoff
          snapshots, guest stays, house guides, master info, maintenance logs,
          and company software-billing metadata.
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
          Stripe customer and subscription IDs are stored on the organization
          when software billing is enabled; card numbers for those subscriptions
          are handled by Stripe, not by us. We never store card numbers for guest
          stay payments because we do not take those payments.
        </li>
        <li>
          If you use Connect your agent, we store a hash of your connection key,
          scopes, and tool activity in your workspace.
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
          We store your profile, assigned properties, job confirmations, and
          bills you submit for your organization.
        </li>
        <li>
          Receipt photos you upload for expenses are stored in cloud storage.
        </li>
        <li>
          Owners and managers in your company can see work and bill data
          according to role permissions.
        </li>
        <li>
          Guest stay Support chat and deposit receipts are not part of your
          staff workflow unless you are also invited as a guest separately.
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
            photos, guest stays, house guides, master info, maintenance logs,
            reports, optional calendar-export URLs and imported occupancy
            blocks, and related records you or your teammates create.
          </li>
          <li>
            Technical data: device and browser type, IP address, app version, log
            events, and session cookies needed to keep you signed in.
          </li>
          <li>
            Optional push subscription tokens if you enable notifications, and
            demo-session cookies when you use public demo seats.
          </li>
          <li>
            We do not collect bank-card numbers for guest rent or deposits. We
            do not receive those payments.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">
          How we use data (safety first)
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>Authenticate you and enforce role-based access</li>
          <li>
            Deliver the features you use and keep workspaces isolated from each
            other
          </li>
          <li>Send notifications you enable</li>
          <li>
            Detect abuse, secure accounts, and keep the Service reliable for
            teams in Thailand and elsewhere
          </li>
          <li>Improve the product with aggregated or de-identified insights</li>
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
          delivery, and Stripe for paid software subscriptions when billing is
          enabled. Providers process data only to provide their services to us.
          They are not paid with your guests’ rent or deposits through us.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">
          Connect your agent (privacy)
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>
            If you create a connection key, we store a hash of the key, a label,
            scopes, and usage metadata. The full key is shown once when you
            create it.
          </li>
          <li>
            When the agent calls {brand.name}, we process the operational data
            those tools read or write - scoped to your current workspace.
          </li>
          <li>
            We do not give the agent your database credentials. You can revoke
            the key at any time in Settings.
          </li>
          <li>
            Third-party agent clients (such as your editor) process your prompts
            on their systems under their own privacy terms.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Retention & security</h2>
        <p className="text-muted">
          We retain data while your organization is active and for a reasonable
          period afterward for backups, dispute handling, and legal compliance.
          We use encrypted transport (HTTPS), access controls, and
          role-separated views so guests, staff, and owners do not see each
          other’s private channels by default. No method is 100% secure; use
          strong passwords or passkeys, limit invites, and protect master codes
          and connection keys.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Your choices & requests</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>Update profile and organization settings in the app</li>
          <li>
            Manage company software billing via the billing portal when
            available
          </li>
          <li>Disconnect agent connection keys in Settings</li>
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
          Thailand, international use & children
        </h2>
        <p className="text-muted">
          We operate with Thailand as our primary market and demo launch
          region. Data may still be processed outside Thailand in regions where
          our providers operate. The Service is for business and property
          operations and is not directed at children under 16. Do not create an
          account for a child under 16.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Changes</h2>
        <p className="text-muted">
          We may update this Policy and post a revised “Last updated” date on
          this page. Continued use means you accept the updated Policy.
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
          The Service is operated under the {brand.name} brand, with current
          operations and demo launch focused on Thailand, at{" "}
          <a
            className="font-semibold text-primary"
            href="https://www.pulseflow.site"
          >
            www.pulseflow.site
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
