"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AGREED_REPLY, isAgreedReply, quoteLabel, type ServiceDelivery } from "@/lib/pros/delivery";
import { QuoteForm, QuoteTag, type QuoteInput } from "@/components/pros/quote-form";
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
  const [nationality, setNationality] = useState<string | null>(null);
  const [nationalityReady, setNationalityReady] = useState(false);
  const [permitQuote, setPermitQuote] = useState<QuoteInput | null>(null);
  const [quoting, setQuoting] = useState<string | null>(null);
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
    const covered = new Set(incoming.map((row) => row.request_id));
    return state.offers
      .filter((offer) => offer.profileId === listingId && !covered.has(offer.requestId))
      .map((offer) => {
        const request = state.requests.find((row) => row.id === offer.requestId);
        return { offer, request };
      })
      .filter((row) => row.request)
      .sort((a, b) => (b.offer.createdAt > a.offer.createdAt ? 1 : -1));
  }, [incoming, listingId, state.offers, state.requests]);

  if (!actor) return null;

  const sendQuote = (id: string, quote: QuoteInput) => {
    setQuoting(id);
    void fetch("/api/services/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "quote", min: quote.min, max: quote.max, currency: quote.currency }),
    }).then((res) => {
      setQuoting(null);
      if (!res.ok) return;
      setIncoming((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                reply_amount: quote.min,
                quote_max: quote.max,
                reply_currency: quote.currency,
              }
            : item,
        ),
      );
    });
  };

  const confirmThai = async () => {
    await fetch("/api/services/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmThai: true }),
    }).catch(() => undefined);
    setNationality("Thai");
  };

  return (
    <div className="space-y-3">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("staffOrders")}</h1>
      {incoming.map((row) => {
        const accepted = isAgreedReply(row.reply_message);
        const price = quoteLabel(row);
        const photos = (row.photos ?? []).filter((src) => typeof src === "string" && src.length > 0);
        return (
          <article
            key={row.id}
            className={
              accepted
                ? "pf-order-fixed space-y-2 rounded-[20px] border border-pf-line p-4"
                : "space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4"
            }
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-pf-12 font-medium text-pf-slate-ink">
                {accepted ? t("appointmentReady") : price ? t("quoteSent") : t("incomingTitle")}
              </p>
              {price ? <QuoteTag label={price} /> : null}
            </div>
            <p className="text-pf-18 font-medium text-pf-ink">{row.title}</p>
            <p className="whitespace-pre-wrap text-pf-16 text-pf-text-secondary">{row.description}</p>
            {photos.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto">
                {photos.map((src) => (
                  <img key={src} src={src} alt="" className="size-20 shrink-0 rounded-[14px] object-cover" />
                ))}
              </div>
            ) : null}
            {row.when_label ? <p className="text-pf-14 text-pf-text-secondary">{row.when_label}</p> : null}
            <Link
              href={to(`/chat/${row.id}`)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-14 font-medium text-pf-ink"
            >
              {t("openChat")}
            </Link>
            {accepted ? (
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
                    price: price ? t("calendarPriceLine", { amount: price }) : null,
                  })
                }
              >
                {t("addToCalendar")}
              </button>
            ) : price ? null : (
              <QuoteForm
                busy={quoting === row.id}
                submitLabel={t("sendQuote")}
                onSubmit={(quote) => {
                  if (nationalityReady && needsWorkPermit(nationality)) {
                    setPermitQuote(quote);
                    setQuoting(row.id);
                    return;
                  }
                  sendQuote(row.id, quote);
                }}
              />
            )}
          </article>
        );
      })}
      {!listingId && incoming.length === 0 ? (
        <p className="text-pf-14 text-pf-text-secondary">{t("noInbox")}</p>
      ) : null}
      {listingId && rows.length === 0 && incoming.length === 0 ? <p className="text-pf-14 text-pf-text-secondary">{t("noInbox")}</p> : null}
      {permitQuote && quoting ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-pf-ink/40 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="permit-title" className="w-full max-w-md rounded-[28px] bg-pf-card p-5">
            <h2 id="permit-title" className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
              {t("permitTitle")}
            </h2>
            <p className="mt-2 text-pf-16 leading-relaxed text-pf-text-secondary">{t("permitBody")}</p>
            <button
              type="button"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white"
              onClick={() => {
                const id = quoting;
                const quote = permitQuote;
                setPermitQuote(null);
                void confirmThai().then(() => sendQuote(id, quote));
              }}
            >
              {t("permitContinue")}
            </button>
            <button
              type="button"
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
              onClick={() => {
                setPermitQuote(null);
                setQuoting(null);
              }}
            >
              {t("permitNotNow")}
            </button>
          </div>
        </div>
      ) : null}
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
