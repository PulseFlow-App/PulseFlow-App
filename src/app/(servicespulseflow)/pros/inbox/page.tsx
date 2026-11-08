"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AGREED_REPLY, compareDeliveries, isAgreedReply, quoteLabel, type ServiceDelivery } from "@/lib/pros/delivery";
import { QuoteForm, type QuoteInput } from "@/components/pros/quote-form";
import { OrderCard, type CustomerOrder, type CustomerOrderState } from "@/components/pros/order-card";
import { downloadVisitIcs } from "@/lib/pros/visit-calendar";
import { statusKey } from "@/lib/pros/i18n";
import { readMyListingId } from "@/lib/pros/join";
import { needsWorkPermit } from "@/lib/pros/permit";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";

function WorkerInboxPage() {
  const { state, actor, actorReady, t } = usePros();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listingId, setListingId] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<ServiceDelivery[]>([]);
  const [nationality, setNationality] = useState<string | null>(null);
  const [nationalityReady, setNationalityReady] = useState(false);
  const [permitQuote, setPermitQuote] = useState<QuoteInput | null>(null);
  const [quoteOpen, setQuoteOpen] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [quoteFocus, setQuoteFocus] = useState(0);
  const [version, setVersion] = useState(0);
  const quoteFormRef = useRef<HTMLDivElement | null>(null);
  const to = (path: string) => servicesPath(pathname, path);
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";

  const quoteParam = searchParams.get("quote");
  useEffect(() => {
    if (!quoteParam) return;
    setBusyId(null);
    setQuoteOpen(quoteParam);
    setQuoteFocus((tick) => tick + 1);
  }, [quoteParam]);

  useEffect(() => {
    if (!quoteOpen) return;
    const timer = window.setTimeout(() => {
      quoteFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const first = quoteFormRef.current?.querySelector<HTMLInputElement>("input");
      first?.focus({ preventScroll: true });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [quoteOpen, quoteFocus, incoming.length]);

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
  }, [actor, actorReady, pathname, router, start, version]);

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
    setBusyId(id);
    void fetch("/api/services/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        action: "quote",
        min: quote.min,
        max: quote.max,
        currency: quote.currency,
        note: quote.note,
      }),
    })
      .then((res) => {
        if (!res.ok) return;
        setQuoteOpen(null);
        const next = new URLSearchParams(searchParams.toString());
        next.delete("quote");
        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        setIncoming((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  reply_amount: quote.min,
                  quote_max: quote.max,
                  reply_currency: quote.currency,
                  quote_note: quote.note,
                }
              : item,
          ),
        );
      })
      .catch(() => undefined)
      .finally(() => setBusyId(null));
  };

  const openQuote = (id: string) => {
    setBusyId(null);
    setQuoteOpen(id);
    setQuoteFocus((tick) => tick + 1);
    const next = new URLSearchParams(searchParams.toString());
    next.set("quote", id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
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
      {incoming.slice().sort(compareDeliveries).map((row) => {
        const cancelled = Boolean(row.cancelled_at);
        const accepted = !cancelled && isAgreedReply(row.reply_message);
        const price = quoteLabel(row);
        const state: CustomerOrderState = cancelled ? "cancelled" : accepted ? "booked" : price ? "price" : "waiting";
        const order: CustomerOrder = {
          id: row.id,
          localRequestId: row.request_id,
          state,
          createdAt: row.created_at,
          title: row.title,
          description: row.description,
          whenLabel: row.when_label,
          area: row.area_label ?? null,
          shareLocation: accepted ? row.share_location ?? null : null,
          photos: (row.photos ?? []).filter((src) => typeof src === "string" && src.length > 0),
          personName: "",
          priceLabel: price,
          quoteNote: row.quote_note ?? null,
          cancelReason: row.cancel_reason ?? null,
          repliedAt: row.replied_at,
          acceptedAt: row.accepted_at ?? null,
          chatHref: to(`/chat/${row.id}`),
          reviewHref: to(`/chat/${row.id}`),
        };
        return (
          <div key={row.id} className="space-y-2">
            <OrderCard
              audience="staff"
              order={order}
              busy={busyId === row.id}
              hideQuoteAction={quoteOpen === row.id}
              onQuote={() => openQuote(row.id)}
              onCalendar={() =>
                downloadVisitIcs({
                  id: row.id,
                  title: row.title,
                  whenLabel: row.when_label,
                  details: row.description,
                  who: row.target_name,
                  price: price ? t("calendarPriceLine", { amount: price }) : null,
                })
              }
            />
            {quoteOpen === row.id && state === "waiting" ? (
              <div
                ref={quoteFormRef}
                id={`quote-${row.id}`}
                className="rounded-[20px] border border-pf-line bg-pf-card p-4 shadow-[var(--pf-shadow-2)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-pf-18 font-bold tracking-[-0.02em] text-pf-ink">{t("provideQuote")}</p>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center px-2 text-pf-14 font-medium text-pf-text-secondary"
                    onClick={() => {
                      setQuoteOpen(null);
                      const next = new URLSearchParams(searchParams.toString());
                      next.delete("quote");
                      const query = next.toString();
                      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
                    }}
                  >
                    {t("close")}
                  </button>
                </div>
                <div className="mt-3">
                  <QuoteForm
                    key={row.id}
                    busy={busyId === row.id}
                    submitLabel={t("sendQuote")}
                    onSubmit={(quote) => {
                      if (nationalityReady && needsWorkPermit(nationality)) {
                        setPermitQuote(quote);
                        return;
                      }
                      sendQuote(row.id, quote);
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      {!listingId && incoming.length === 0 ? (
        <p className="text-pf-14 text-pf-text-secondary">{t("noInbox")}</p>
      ) : null}
      {listingId && rows.length === 0 && incoming.length === 0 ? <p className="text-pf-14 text-pf-text-secondary">{t("noInbox")}</p> : null}
      {permitQuote && quoteOpen ? (
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
                const id = quoteOpen;
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
                setQuoteOpen(null);
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

export default function InboxPage() {
  return (
    <Suspense>
      <WorkerInboxPage />
    </Suspense>
  );
}
