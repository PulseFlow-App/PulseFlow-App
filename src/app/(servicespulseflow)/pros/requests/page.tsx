"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ServicesAccountGate } from "@/components/pros/parts";
import {
  OrderCard,
  OrderCardSkeleton,
  PaymentNote,
  RequestsEmpty,
  orderVisitDate,
  type CustomerOrder,
  type CustomerOrderState,
} from "@/components/pros/order-card";
import { compareDeliveries, isAgreedReply, quoteLabel, type ServiceDelivery } from "@/lib/pros/delivery";
import { areaName } from "@/lib/pros/matching";
import { servicesPath } from "@/lib/pros/paths";
import { downloadVisitIcs } from "@/lib/pros/visit-calendar";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";
import type { ProRequest } from "@/lib/pros/types";
import { cn } from "@/lib/utils";

function customerState(row: ServiceDelivery, local: ProRequest | undefined, reviewed: boolean): CustomerOrderState {
  if (row.cancelled_at) return "cancelled";
  if (local?.status === "completed" || reviewed) return "done";
  if (isAgreedReply(row.reply_message)) return "booked";
  if (row.reply_amount != null) return "price";
  return "waiting";
}

function localCardState(row: ProRequest, reviewed: boolean): CustomerOrderState {
  if (row.status === "cancelled") return "cancelled";
  if (row.status === "completed" || reviewed) return "done";
  if (
    row.status === "scheduled" ||
    row.status === "chosen" ||
    row.status === "in_progress" ||
    row.status === "awaiting_approval"
  ) {
    return "booked";
  }
  return "waiting";
}

function dayHeading(date: Date | null, locale: string, todayLabel: string, tomorrowLabel: string, flexibleLabel: string) {
  if (!date) return flexibleLabel;
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diff = Math.round((start(date) - start(new Date())) / 86400000);
  if (diff === 0) return todayLabel;
  if (diff === 1) return tomorrowLabel;
  const parts = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).formatToParts(date);
  const bit = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return [bit("weekday"), bit("day"), bit("month")].filter(Boolean).join(" ");
}

export default function RequestsPage() {
  const { state, actor, actorReady, t } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const [remote, setRemote] = useState<ServiceDelivery[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [segment, setSegment] = useState<"active" | "done">("active");
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (!actor) return;
    let cancel = false;
    void fetch("/api/services/requests", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load"))))
      .then((body: { requests?: ServiceDelivery[] }) => {
        if (cancel) return;
        setFailed(false);
        setRemote(body.requests ?? []);
      })
      .catch(() => {
        if (cancel) return;
        setFailed(true);
        setRemote((current) => current ?? []);
      });
    return () => {
      cancel = true;
    };
  }, [actor, version]);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    let startY = 0;
    const onScroll = () => setCompact(main.scrollTop > 12);
    const start = (event: TouchEvent) => {
      startY = main.scrollTop <= 0 ? event.touches[0]?.clientY ?? 0 : 0;
    };
    const end = (event: TouchEvent) => {
      const y = event.changedTouches[0]?.clientY ?? 0;
      if (startY && y - startY > 64) setVersion((current) => current + 1);
      startY = 0;
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    main.addEventListener("touchstart", start, { passive: true });
    main.addEventListener("touchend", end);
    return () => {
      main.removeEventListener("scroll", onScroll);
      main.removeEventListener("touchstart", start);
      main.removeEventListener("touchend", end);
    };
  }, []);

  const accept = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/services/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "accept" }),
      });
      if (res.ok) setVersion((current) => current + 1);
    } finally {
      setBusy(null);
    }
  };

  const reviewedIds = new Set(state.reviews.map((review) => review.requestId).filter((id): id is string => Boolean(id)));
  const mine = (remote ?? []).filter((row) => row.created_by === actor?.id).sort(compareDeliveries);
  const linked = new Set(mine.map((row) => row.request_id));
  const localOnly = state.requests.filter((row) => row.createdBy === actor?.id && !linked.has(row.id));

  const cards: CustomerOrder[] = [
    ...mine.map((row) => {
      const local = state.requests.find((item) => item.id === row.request_id);
      const reviewed = reviewedIds.has(row.request_id);
      const price = quoteLabel(row);
      return {
        id: row.id,
        localRequestId: row.request_id,
        state: customerState(row, local, reviewed),
        createdAt: row.created_at,
        title: row.title,
        description: row.description,
        whenLabel: row.when_label,
        area: row.area_label || (local ? areaName(state, local.areaId, locale) || null : null),
        shareLocation: row.share_location ?? local?.shareLocation ?? null,
        photos: row.photos ?? [],
        personName: row.target_name,
        priceLabel: price,
        quoteNote: row.quote_note ?? null,
        cancelReason: row.cancel_reason ?? null,
        repliedAt: row.replied_at,
        acceptedAt: row.accepted_at ?? null,
        chatHref: servicesPath(pathname, `/chat/${row.id}`),
        reviewHref: servicesPath(pathname, `/requests/${row.request_id}`),
      } satisfies CustomerOrder;
    }),
    ...localOnly.map((row) => {
      const profile = state.profiles.find((item) => item.id === (row.chosenProfileId || row.invitedProfileId));
      const when = [row.preferredDate, row.preferredTime].filter(Boolean).join(" · ");
      return {
        id: row.id,
        state: localCardState(row, reviewedIds.has(row.id)),
        createdAt: row.createdAt,
        title: row.title,
        description: row.description,
        whenLabel: when || null,
        area: row.areaLabel || areaName(state, row.areaId, locale) || null,
        shareLocation: row.shareLocation ?? null,
        photos: row.photos ?? [],
        personName: profile?.name ?? "",
        priceLabel: row.finalAmount != null ? `${row.finalAmount} ${row.finalCurrency ?? ""}`.trim() : null,
        quoteNote: null,
        cancelReason: null,
        repliedAt: null,
        acceptedAt: null,
        chatHref: servicesPath(pathname, `/requests/${row.id}`),
        reviewHref: servicesPath(pathname, `/requests/${row.id}`),
      } satisfies CustomerOrder;
    }),
  ];

  const visible = cards.filter((card) => (segment === "done" ? card.state === "done" : card.state !== "done"));
  const needs = segment === "active" ? visible.filter((card) => card.state === "price") : [];
  const rest = visible.filter((card) => card.state !== "price" || segment === "done");
  const groups = new Map<string, { label: string; sort: number; cards: CustomerOrder[] }>();
  for (const card of rest) {
    const date = orderVisitDate(card.whenLabel);
    const key = date ? String(date.getTime()) : "none";
    const current = groups.get(key) ?? {
      label: dayHeading(date, locale, t("today"), t("tomorrow"), t("flexible")),
      sort: date ? date.getTime() : Number.MAX_SAFE_INTEGER,
      cards: [],
    };
    current.cards.push(card);
    groups.set(key, current);
  }
  const sections = [...groups.values()].sort((a, b) => a.sort - b.sort);
  const empty = actor != null && remote != null && cards.length === 0 && !failed;
  const loading = actor != null && remote === null && !failed;

  const saveCalendar = (card: CustomerOrder) => {
    downloadVisitIcs({
      id: card.id,
      title: card.title,
      whenLabel: card.whenLabel,
      details: card.description,
      who: card.personName,
      price: card.priceLabel ? t("calendarPriceLine", { amount: card.priceLabel }) : null,
    });
  };

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 -mx-4 bg-pf-page/95 px-4 pb-2 pt-1 backdrop-blur-xl">
        <h1
          className={cn(
            "font-bold tracking-[-0.02em] text-pf-ink transition-[font-size] duration-200",
            compact ? "text-[17px]" : "text-pf-28",
          )}
        >
          {t("requests")}
        </h1>
        <div className="mt-2 grid grid-cols-2 rounded-full bg-pf-card p-1" role="tablist">
          {(["active", "done"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={segment === item}
              className={cn(
                "min-h-11 rounded-full px-3 text-pf-14 font-medium",
                segment === item ? "bg-pf-navy-600 text-white" : "text-pf-text-secondary",
              )}
              onClick={() => setSegment(item)}
            >
              {item === "active" ? t("listActive") : t("cardDone")}
            </button>
          ))}
        </div>
      </div>
      {actorReady && !actor ? (
        <>
          <p className="text-pf-14 text-pf-text-secondary">{t("ordersEmpty")}</p>
          <ServicesAccountGate next={pathname} />
        </>
      ) : null}
      {loading ? (
        <>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </>
      ) : null}
      {failed && cards.length === 0 ? (
        <div className="rounded-[20px] border border-pf-line bg-pf-card px-4 py-6 text-center">
          <p className="text-pf-16 text-pf-ink">{t("couldNotLoad")}</p>
          <button
            type="button"
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-pf-orange-500 px-5 text-pf-16 font-medium text-white"
            onClick={() => {
              setFailed(false);
              setRemote(null);
              setVersion((current) => current + 1);
            }}
          >
            {t("retry")}
          </button>
        </div>
      ) : null}
      {empty ? <RequestsEmpty href={servicesPath(pathname, "/find")} /> : null}
      {needs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="sticky top-[92px] z-[1] bg-pf-page/95 py-1 text-pf-14 font-medium text-pf-text-secondary backdrop-blur-xl">
            {t("needsYou")}
            <span className="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pf-navy-600 px-1 text-[11px] font-medium text-white">
              {needs.length}
            </span>
          </h2>
          {needs.map((card) => (
            <OrderCard
              key={card.id}
              order={card}
              busy={busy === card.id}
              onAccept={() => void accept(card.id)}
              onCalendar={() => saveCalendar(card)}
            />
          ))}
        </section>
      ) : null}
      {sections.map((section) => (
        <section key={section.label + section.sort} className="space-y-3">
          <h2 className="sticky top-[92px] z-[1] bg-pf-page/95 py-1 text-pf-14 font-medium text-pf-text-secondary backdrop-blur-xl">
            {section.label}
          </h2>
          {section.cards.map((card) => (
            <OrderCard
              key={card.id}
              order={card}
              busy={busy === card.id}
              onAccept={() => void accept(card.id)}
              onCalendar={() => saveCalendar(card)}
            />
          ))}
        </section>
      ))}
      {actor && !empty ? <PaymentNote /> : null}
    </div>
  );
}
