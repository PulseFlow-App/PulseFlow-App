"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useData } from "@/lib/data/use-app-data";
import { formatMoney, formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { StayQuoteCard } from "@/components/guest/stay-quote-card";
import { GuestVillasBrowse } from "@/components/guest/guest-villas-browse";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { isConfirmedStayStatus } from "@/lib/guest/confirmed-stay";
import { matchingAcceptedStayDateRequest } from "@/lib/guest/stay-date-request";
import { isDepositPaid } from "@/lib/guest/deposit-from-quote";
import {
  guestBookingGuideHref,
  writeSelectedStayId,
} from "@/lib/guest/selected-stay";
import { useDisplayCurrency } from "@/lib/billing/use-display-currency";
import type { GuestStay, VillaListItem } from "@/lib/types";

type CompanySection = {
  orgId: string;
  orgName: string;
  bookings: GuestStay[];
  villas: VillaListItem[];
};

export function GuestHome({ name }: { name: string }) {
  const data = useData();
  const { t } = useI18n();
  const { convertToDisplay, displayCurrency } = useDisplayCurrency();
  const first = name.split(" ")[0] || name;
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [quoteMsg, setQuoteMsg] = useState<string | null>(null);
  const [declineQuoteId, setDeclineQuoteId] = useState<string | null>(null);
  const [browseOrgId, setBrowseOrgId] = useState<string | null>(null);

  const bookings = useMemo(
    () =>
      data.guestStays
        .filter((s) => isConfirmedStayStatus(s.status))
        .sort((a, b) => +new Date(a.check_in) - +new Date(b.check_in)),
    [data.guestStays],
  );

  const quotedRequests = useMemo(
    () =>
      data.stayDateRequests.filter(
        (r) => r.status === "quoted" && r.quoted_price_amount != null,
      ),
    [data.stayDateRequests],
  );

  const companyVillas = useMemo(
    () => data.villaList.filter((v) => v.bucket === "company"),
    [data.villaList],
  );

  const sections = useMemo((): CompanySection[] => {
    const byOrg = new Map<string, CompanySection>();

    const ensure = (orgId: string, fallbackName?: string) => {
      let section = byOrg.get(orgId);
      if (!section) {
        const org = data.orgs.find((o) => o.id === orgId);
        section = {
          orgId,
          orgName: org?.name ?? fallbackName ?? t("guest.companyFallback"),
          bookings: [],
          villas: [],
        };
        byOrg.set(orgId, section);
      }
      return section;
    };

    for (const v of companyVillas) {
      ensure(v.org_id, v.orgLabel).villas.push(v);
    }

    for (const stay of bookings) {
      const villa =
        data.villas.find((v) => v.id === stay.villa_id) ??
        data.allOrgVillas.find((v) => v.id === stay.villa_id);
      const section = ensure(
        stay.org_id,
        villa ? companyVillas.find((v) => v.org_id === stay.org_id)?.orgLabel : undefined,
      );
      section.bookings.push(stay);
    }

    // Active company with no villas loaded yet still appears
    if (data.profile?.org_id && data.organization?.kind === "company") {
      ensure(data.profile.org_id, data.organization.name);
    }

    const ordered = [...byOrg.values()].sort((a, b) =>
      a.orgName.localeCompare(b.orgName),
    );
    // Prefer active org first
    const activeId = data.profile?.org_id;
    if (activeId) {
      ordered.sort((a, b) => {
        if (a.orgId === activeId) return -1;
        if (b.orgId === activeId) return 1;
        return a.orgName.localeCompare(b.orgName);
      });
    }
    return ordered;
  }, [
    bookings,
    companyVillas,
    data.allOrgVillas,
    data.organization,
    data.orgs,
    data.profile?.org_id,
    data.villas,
    t,
  ]);

  useEffect(() => {
    if (browseOrgId != null) return;
    const empty = sections.find(
      (s) => s.bookings.length === 0 && s.villas.length > 0,
    );
    if (empty) setBrowseOrgId(empty.orgId);
  }, [sections, browseOrgId]);

  const renderBookingCard = (stay: GuestStay) => {
    const villa =
      data.villas.find((v) => v.id === stay.villa_id) ??
      data.allOrgVillas.find((v) => v.id === stay.villa_id);
    const quote = matchingAcceptedStayDateRequest(
      data.stayDateRequests,
      stay,
    );
    const deposit =
      data.guestDeposits.find((d) => d.stay_id === stay.id) ?? null;
    const price =
      quote?.quoted_price_amount != null && quote.quoted_price_currency
        ? convertToDisplay(
            Number(quote.quoted_price_amount),
            quote.quoted_price_currency,
          )
        : null;
    const depositAmount =
      deposit && deposit.amount > 0
        ? convertToDisplay(Number(deposit.amount), deposit.currency)
        : quote?.quoted_deposit_amount != null &&
            quote.quoted_deposit_currency
          ? convertToDisplay(
              Number(quote.quoted_deposit_amount),
              quote.quoted_deposit_currency,
            )
          : null;
    const paid = isDepositPaid(deposit);

    return (
      <Link
        key={stay.id}
        href={guestBookingGuideHref(stay.id)}
        onClick={() => writeSelectedStayId(stay.id)}
        className="block"
      >
        <Card className="space-y-2 p-4 transition hover:bg-white/90">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-lg font-bold text-ink">
              {villa?.name ?? t("dateRequests.unknownVilla")}
            </p>
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              {stay.status === "active"
                ? t("guest.bookingActive")
                : t("guest.bookingUpcoming")}
            </span>
          </div>
          <p className="text-sm text-ink">
            {formatShortDate(stay.check_in)} →{" "}
            {formatShortDate(stay.check_out)}
          </p>
          {price != null ? (
            <p className="text-sm font-semibold text-ink">
              {t("guest.bookingPrice", {
                amount: formatMoney(price, displayCurrency),
              })}
            </p>
          ) : null}
          {depositAmount != null ? (
            <p className="text-sm text-muted">
              {t("guest.bookingDeposit", {
                amount: formatMoney(depositAmount, displayCurrency),
                status: paid
                  ? t("guest.depositPaid")
                  : t("guest.depositDue"),
              })}
            </p>
          ) : (
            <p className="text-sm text-muted">{t("guest.bookingNoDeposit")}</p>
          )}
          <p className="text-sm font-bold text-primary">
            {t("guest.openBookingGuide")} →
          </p>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-4 animate-rise">
      <ConfirmDialog
        open={declineQuoteId != null}
        title={t("guest.quoteDeclineTitle")}
        description={t("guest.quoteDeclineConfirm")}
        confirmLabel={t("guest.quoteDecline")}
        busy={quoteBusy}
        onConfirm={() => {
          if (!declineQuoteId) return;
          setQuoteBusy(true);
          void data
            .cancelStayDateRequest(declineQuoteId)
            .then(() => {
              setQuoteMsg(t("guest.requestCancelled"));
              setDeclineQuoteId(null);
            })
            .catch((e) =>
              setQuoteMsg(e instanceof Error ? e.message : t("common.error")),
            )
            .finally(() => setQuoteBusy(false));
        }}
        onClose={() => {
          if (!quoteBusy) setDeclineQuoteId(null);
        }}
      />

      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("guest.hi", { name: first })}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("guest.homeSubtitle")}</p>
      </div>

      {quoteMsg ? (
        <p className="text-sm font-semibold text-secondary">{quoteMsg}</p>
      ) : null}

      {quotedRequests.map((request) => (
        <StayQuoteCard
          key={request.id}
          request={request}
          busy={quoteBusy}
          onConfirm={() => {
            setQuoteBusy(true);
            void data
              .confirmStayDateRequest(request.id)
              .then(() => setQuoteMsg(t("guest.quoteConfirmed")))
              .catch((e) =>
                setQuoteMsg(e instanceof Error ? e.message : t("common.error")),
              )
              .finally(() => setQuoteBusy(false));
          }}
          onDecline={() => setDeclineQuoteId(request.id)}
        />
      ))}

      {sections.length === 0 ? (
        <Card className="p-5">
          <p className="text-sm text-muted">{t("guest.noStay")}</p>
        </Card>
      ) : (
        sections.map((section) => {
          const browsing = browseOrgId === section.orgId;
          return (
            <section key={section.orgId} className="space-y-3">
              <h2 className="font-display text-lg font-bold text-ink">
                {section.orgName}
              </h2>

              {section.bookings.length ? (
                <div className="space-y-3">
                  {section.bookings.map(renderBookingCard)}
                </div>
              ) : (
                <Card className="p-5">
                  <p className="text-sm text-muted">{t("guest.noStay")}</p>
                </Card>
              )}

              <div>
                <button
                  type="button"
                  className="text-sm font-bold text-primary"
                  onClick={() =>
                    setBrowseOrgId((id) =>
                      id === section.orgId ? null : section.orgId,
                    )
                  }
                >
                  {browsing
                    ? t("guest.hideBrowseVillas")
                    : t("guest.browseVillas")}{" "}
                  {browsing ? "↑" : "↓"}
                </button>
                {browsing ? (
                  <div className="mt-3">
                    <GuestVillasBrowse villas={section.villas} />
                  </div>
                ) : null}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
