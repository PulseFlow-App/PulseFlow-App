"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VisitCalendarSheet } from "@/components/pros/visit-notice";
import { AGREED_REPLY, type ServiceDelivery } from "@/lib/pros/delivery";
import { downloadVisitIcs } from "@/lib/pros/visit-calendar";
import { statusKey } from "@/lib/pros/i18n";
import { readMyListingId } from "@/lib/pros/join";
import { needsWorkPermit } from "@/lib/pros/permit";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";

export default function WorkerInboxPage() {
  const { state, actor, actorReady, t } = usePros();
  const pathname = usePathname();
  const router = useRouter();
  const [listingId, setListingId] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<ServiceDelivery[]>([]);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [calendarFor, setCalendarFor] = useState<ServiceDelivery | null>(null);
  const [nationality, setNationality] = useState<string | null>(null);
  const [nationalityReady, setNationalityReady] = useState(false);
  const [permitFor, setPermitFor] = useState<string | null>(null);
  const to = (path: string) => servicesPath(pathname, path);
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";

  useEffect(() => {
    if (!actorReady) return;
    if (!actor) {
      router.replace(`${start}?mode=sign-in&next=${encodeURIComponent(servicesPath(pathname, "/inbox"))}`);
      return;
    }
    setListingId(readMyListingId());
    void fetch("/api/services/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { profile?: { nationality?: string | null } | null } | null) => {
        setNationality(payload?.profile?.nationality ?? null);
        setNationalityReady(true);
      })
      .catch(() => {
        setNationality(null);
        setNationalityReady(true);
      });
    void fetch("/api/services/requests")
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((payload: { requests?: ServiceDelivery[] }) => {
        const rows = (payload.requests ?? []).filter((row) => row.target_profile_id === actor.id);
        setIncoming(rows);
      })
      .catch(() => setIncoming([]));
  }, [actor, actorReady, pathname, router, start]);

  const rows = useMemo(() => {
    if (!listingId) return [];
    return state.offers
      .filter((offer) => offer.profileId === listingId)
      .map((offer) => {
        const request = state.requests.find((row) => row.id === offer.requestId);
        return { offer, request };
      })
      .filter((row) => row.request)
      .sort((a, b) => (b.offer.createdAt > a.offer.createdAt ? 1 : -1));
  }, [listingId, state.offers, state.requests]);

  if (!actor) return null;

  const agree = (id: string) => {
    const row = incoming.find((item) => item.id === id);
    void fetch("/api/services/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, agree: true }),
    }).then((res) => {
      if (!res.ok || !row) return;
      setSent((current) => ({ ...current, [id]: true }));
      setIncoming((current) =>
        current.map((item) => (item.id === id ? { ...item, reply_message: AGREED_REPLY } : item)),
      );
      setCalendarFor(row);
    });
  };

  const firstWaitingId = incoming.find((row) => !row.reply_message && !sent[row.id])?.id;

  return (
    <div className="space-y-3">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("staffOrders")}</h1>
      {incoming.map((row) => {
        const agreed = Boolean(row.reply_message) || sent[row.id];
        const onlyOne = row.id === firstWaitingId;
        return (
          <article key={row.id} className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
            <p className="text-pf-12 font-medium text-pf-slate-ink">{t("incomingTitle")}</p>
            <p className="text-pf-18 font-medium text-pf-ink">{row.title}</p>
            <p className="whitespace-pre-wrap text-pf-16 text-pf-text-secondary">{row.description}</p>
            {row.when_label ? <p className="text-pf-14 text-pf-text-secondary">{row.when_label}</p> : null}
            <Link
              href={to(`/chat/${row.id}`)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-14 font-medium text-pf-ink"
            >
              {agreed ? t("chatTitle") : t("openChat")}
            </Link>
            {agreed ? (
              <>
                <p className="text-pf-14 font-medium text-pf-ink">{t("agreedComing")}</p>
                <button
                  type="button"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pf-navy-600 px-4 text-pf-16 font-medium text-white"
                  onClick={() =>
                    downloadVisitIcs({
                      id: row.id,
                      title: row.title,
                      whenLabel: row.when_label,
                      details: row.description,
                      who: row.target_name,
                    })
                  }
                >
                  {t("addToCalendar")}
                </button>
              </>
            ) : onlyOne ? (
                <Button
                  type="button"
                  className="min-h-12 w-full"
                  reflectGlobalBusy={false}
                  onClick={() => {
                    if (nationalityReady && needsWorkPermit(nationality)) {
                      setPermitFor(row.id);
                      return;
                    }
                    agree(row.id);
                  }}
                >
                  {t("agree")}
                </Button>
              ) : (
                <button
                  type="button"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pf-navy-600 px-4 text-pf-16 font-medium text-white"
                  onClick={() => {
                    if (nationalityReady && needsWorkPermit(nationality)) {
                      setPermitFor(row.id);
                      return;
                    }
                    agree(row.id);
                  }}
                >
                  {t("agree")}
                </button>
              )}
          </article>
        );
      })}
      {!listingId && incoming.length === 0 ? (
        <p className="text-pf-14 text-pf-text-secondary">{t("noInbox")}</p>
      ) : null}
      {listingId && rows.length === 0 && incoming.length === 0 ? <p className="text-pf-14 text-pf-text-secondary">{t("noInbox")}</p> : null}
      {permitFor ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-pf-ink/40 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="permit-title" className="w-full max-w-md rounded-[28px] bg-pf-card p-5">
            <h2 id="permit-title" className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
              {t("permitTitle")}
            </h2>
            <p className="mt-2 text-pf-16 leading-relaxed text-pf-text-secondary">{t("permitBody")}</p>
            <Button
              type="button"
              className="mt-4 min-h-12 w-full"
              reflectGlobalBusy={false}
              onClick={() => {
                const id = permitFor;
                setPermitFor(null);
                agree(id);
              }}
            >
              {t("permitContinue")}
            </Button>
            <button
              type="button"
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
              onClick={() => setPermitFor(null)}
            >
              {t("permitNotNow")}
            </button>
          </div>
        </div>
      ) : null}
      <VisitCalendarSheet visit={calendarFor ? {
        id: calendarFor.id,
        title: calendarFor.title,
        whenLabel: calendarFor.when_label,
        details: calendarFor.description,
        who: calendarFor.target_name,
      } : null} onClose={() => setCalendarFor(null)} />
      {rows.map(({ offer, request }) => (
        <article
          key={offer.id}
          className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-pf-ink">{request?.title}</p>
              <p className="text-pf-14 text-pf-text-secondary">
                {request ? t(statusKey(request.status)) : null}
                {offer.status !== "pending" ? ` · ${offer.status}` : null}
              </p>
            </div>
            {offer.status === "pending" && offer.message !== AGREED_REPLY ? (
              <Link
                href={to(`/reply/${offer.token}`)}
                className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-pf-navy-600 px-3 text-pf-14 font-medium text-white"
              >
                {t("agree")}
              </Link>
            ) : (
              <Link
                href={to(`/requests/${request?.id}`)}
                className="shrink-0 text-pf-12 font-medium text-pf-text-secondary"
              >
                {t("requests")}
              </Link>
            )}
          </div>
          {offer.message && offer.message !== AGREED_REPLY ? (
            <p className="text-pf-16 text-pf-text-secondary">{offer.message}</p>
          ) : null}
          {offer.amount != null ? (
            <p className="text-pf-14 font-medium text-pf-ink">
              {offer.amount} {offer.currency ?? ""}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
