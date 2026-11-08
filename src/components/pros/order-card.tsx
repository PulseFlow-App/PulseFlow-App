"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Calendar, Check, CloudSun, Info, Lock, MapPin, MessageCircle, Moon, MoreHorizontal, Sun, X } from "lucide-react";
import { OrderActions, cancelReasonText } from "@/components/pros/order-actions";
import { selectionTick, successTick } from "@/components/pros/haptics";
import { preferredTimeKey } from "@/lib/pros/i18n";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const ADDED_KEY = "pulseflow.services.calendarAdded.v1";

export type CustomerOrderState = "waiting" | "price" | "booked" | "done" | "cancelled";

export type CustomerOrder = {
  id: string;
  /** Local draft id when the card is backed by a server delivery row. */
  localRequestId?: string | null;
  state: CustomerOrderState;
  createdAt: string;
  title: string;
  description: string;
  whenLabel: string | null;
  area: string | null;
  /** Exact pin/address. Present for staff only after the quote is accepted. */
  shareLocation: string | null;
  photos: string[];
  personName: string;
  priceLabel: string | null;
  quoteNote: string | null;
  cancelReason: string | null;
  repliedAt: string | null;
  acceptedAt: string | null;
  chatHref: string;
  reviewHref: string;
};

function shortTime(label: string) {
  return label.split(",")[0].replace(/\s+\d.*/, "").trim();
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function readAdded(): string[] {
  try {
    const raw = localStorage.getItem(ADDED_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function rememberAdded(id: string) {
  const ids = new Set(readAdded());
  ids.add(id);
  localStorage.setItem(ADDED_KEY, JSON.stringify([...ids]));
}

function relativeTime(iso: string, locale: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((then - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 36) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

function visitDate(whenLabel: string | null, now = new Date()) {
  let date: Date | null = null;
  let time: string | null = null;
  for (const part of (whenLabel ?? "").split("·").map((item) => item.trim()).filter(Boolean)) {
    const token = part.toLowerCase();
    if (/^\d{4}-\d{2}-\d{2}/.test(part)) {
      const [year, month, day] = part.slice(0, 10).split("-").map(Number);
      date = new Date(year, month - 1, day);
    } else if (token === "today") date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (token === "tomorrow") date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    else if (token === "morning" || token === "afternoon" || token === "evening" || token === "any") time = token;
  }
  return { date, time };
}

function dayKey(date: Date | null) {
  if (!date) return "none";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function orderVisitDate(whenLabel: string | null) {
  return visitDate(whenLabel).date;
}

export function orderDayKey(whenLabel: string | null) {
  return dayKey(visitDate(whenLabel).date);
}

function TimeIcon({ time }: { time: string | null }) {
  const className = "size-3.5 shrink-0";
  if (time === "evening") return <Moon className={className} strokeWidth={2} aria-hidden />;
  if (time === "afternoon") return <CloudSun className={className} strokeWidth={2} aria-hidden />;
  return <Sun className={className} strokeWidth={2} aria-hidden />;
}

export function OrderCard({
  order,
  onAccept,
  onQuote,
  onCalendar,
  busy,
  hideQuoteAction = false,
  audience = "customer",
}: {
  order: CustomerOrder;
  onAccept?: () => void;
  onQuote?: () => void;
  onCalendar?: () => void;
  busy?: boolean;
  hideQuoteAction?: boolean;
  audience?: "customer" | "staff";
}) {
  const { t } = usePros();
  const { locale } = useI18n();
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState(false);
  const [askCancel, setAskCancel] = useState(false);
  const swiped = useRef(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const [when, setWhen] = useState("");
  const [drag, setDrag] = useState(0);
  const [press, setPress] = useState(false);
  const visit = visitDate(order.whenLabel);
  const shownDate = visit.date ?? (Number.isNaN(new Date(order.createdAt).getTime()) ? null : new Date(order.createdAt));
  const timeKey = preferredTimeKey(visit.time);
  const timeLabel = timeKey ? t(timeKey) : null;
  const price = order.priceLabel?.replace(/\s*THB\b/g, " ฿").replace("–", "-").trim() ?? null;
  const stepIndex = order.state === "price" ? 1 : order.state === "booked" ? 2 : order.state === "done" ? 3 : 0;
  const showSteps = order.state !== "cancelled";
  const steps = [t("statusRequested"), t("stepPrice"), t("cardBooked"), t("cardDone")] as const;
  const quiet = order.state === "cancelled";

  useEffect(() => {
    setAdded(readAdded().includes(order.id));
    setWhen(relativeTime(order.createdAt, locale));
  }, [order.id, order.createdAt, locale]);

  const dateParts = shownDate
    ? new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).formatToParts(shownDate)
    : [];
  const part = (type: Intl.DateTimeFormatPartTypes) => dateParts.find((item) => item.type === type)?.value ?? "";

  return (
    <div className="pf-order-in relative overflow-hidden rounded-[20px]">
      {order.state !== "cancelled" && order.state !== "done" ? (
        <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-pf-danger-ink text-pf-14 font-medium text-white">
          {t("cancelJob")}
        </div>
      ) : null}
      <article
        className={cn(
          "relative rounded-[20px] border border-pf-line p-3 shadow-[var(--pf-shadow-2)]",
          order.state === "done" ? "bg-pf-page" : "bg-pf-card",
          quiet && "opacity-60",
          press && "scale-[0.98]",
          "transition-transform duration-200 ease-out motion-reduce:scale-100 motion-reduce:transition-none",
        )}
        style={{ transform: drag ? `translateX(${drag}px)` : undefined }}
      >
        <button
          type="button"
          aria-label={t("orderDetails")}
          className="absolute end-2 top-2 z-10 inline-flex size-11 items-center justify-center rounded-full text-pf-ink"
          onClick={() => setSheet(true)}
        >
          <Info className="size-5" strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          className="block w-full pe-10 text-left"
          onClick={() => {
            if (swiped.current) {
              swiped.current = false;
              return;
            }
            setSheet(true);
          }}
          onPointerDown={(event) => {
            if (order.state === "cancelled" || order.state === "done") return;
            const startX = event.clientX;
            setPress(true);
            const move = (next: PointerEvent) => setDrag(Math.max(Math.min(0, next.clientX - startX), -96));
            const up = (next: PointerEvent) => {
              setPress(false);
              const delta = next.clientX - startX;
              setDrag(0);
              if (delta < -72) {
                swiped.current = true;
                selectionTick();
                setAskCancel(true);
              }
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", up);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
          }}
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-pf-page px-2 text-pf-12 font-medium text-pf-ink">
              <StatusMark state={order.state} />
              {order.state === "waiting"
                ? audience === "staff"
                  ? t("incomingTitle")
                  : t("cardWaiting")
                : order.state === "price"
                  ? audience === "staff"
                    ? t("quoteSent")
                    : t("cardPriceReceived")
                  : order.state === "booked"
                    ? t("cardBooked")
                    : order.state === "done"
                      ? t("cardDone")
                      : t("cancelled")}
            </span>
          </div>
          <div className="mt-3 flex gap-3">
            <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-[14px] bg-pf-page text-pf-ink">
              <span className="text-[10px] font-medium uppercase">{part("weekday")}</span>
              <span className="text-pf-22 font-bold leading-none tabular-nums">{part("day")}</span>
              <span className="text-[10px] font-medium">{part("month")}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-[17px] font-bold leading-snug tracking-[-0.02em] text-pf-ink">{order.title}</h3>
              <p className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-pf-14 font-medium text-pf-text-secondary">
                {timeLabel ? (
                  <span className="inline-flex items-center gap-1">
                    <TimeIcon time={visit.time} />
                    {shortTime(timeLabel)}
                  </span>
                ) : null}
                {order.area ? (
                  <span className="inline-flex min-w-0 items-center gap-1 truncate">
                    <MapPin className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                    <span className="truncate">{order.area}</span>
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </button>
        {order.personName.trim() ? (
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-pf-navy-900 text-[11px] font-medium text-white">
              {firstName(order.personName).slice(0, 1)}
            </span>
            <span className="text-pf-14 font-medium text-pf-ink">{firstName(order.personName)}</span>
          </div>
        ) : null}
        {price && order.state !== "cancelled" ? (
          <p className="mt-2 text-pf-28 font-bold tabular-nums tracking-[-0.02em] text-pf-ink">{price}</p>
        ) : null}
        {order.state === "booked" ? (
          <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-pf-navy-600 px-3 py-2 text-white">
            <div className="min-w-0 flex-1">
              <p className="text-pf-12 font-medium text-white/80">{t("cardBooked")}</p>
              <p className="text-pf-16 font-medium tabular-nums">
                {[part("weekday"), part("day"), part("month"), timeLabel ? shortTime(timeLabel) : null].filter(Boolean).join(" ")}
              </p>
            </div>
            {added ? (
              <span className="inline-flex size-11 items-center justify-center" aria-label={t("calendarAdded")}>
                <Check className="size-5" strokeWidth={2} aria-hidden />
              </span>
            ) : (
              <button
                type="button"
                className="inline-flex min-h-11 max-w-[46%] items-center gap-1 rounded-full border border-white/50 px-3 text-pf-14 font-medium"
                onClick={() => {
                  selectionTick();
                  onCalendar?.();
                  rememberAdded(order.id);
                  setAdded(true);
                }}
              >
                <Calendar className="size-4" strokeWidth={2} aria-hidden />
                <span className="whitespace-normal text-left leading-tight">{t("cardCalendar")}</span>
              </button>
            )}
          </div>
        ) : null}
        {showSteps ? (
          <div className="mt-3" aria-label={steps[stepIndex]}>
            <ol className="flex items-center">
              {steps.map((label, index) => (
                <li key={label} className="flex min-w-0 flex-1 items-center">
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full",
                      index <= stepIndex ? "bg-pf-navy-600 text-white" : "bg-pf-line",
                    )}
                  >
                    {index < stepIndex ? <Check className="size-3" strokeWidth={3} aria-hidden /> : null}
                  </span>
                  {index < steps.length - 1 ? (
                    <span className={cn("mx-1 h-px flex-1", index < stepIndex ? "bg-pf-navy-600" : "bg-pf-line")} />
                  ) : null}
                </li>
              ))}
            </ol>
            <p className="mt-1 text-[11px] font-medium text-pf-ink">{steps[stepIndex]}</p>
          </div>
        ) : null}
        {order.state === "cancelled" && order.cancelReason ? (
          <p className="mt-2 whitespace-pre-wrap text-pf-14 text-pf-text-secondary">{cancelReasonText(order.cancelReason, t)}</p>
        ) : null}
        {order.state !== "cancelled" ? (
          <div className="mt-3 flex items-center gap-2">
            {audience === "staff" && order.state === "waiting" && !hideQuoteAction ? (
              <button
                type="button"
                disabled={busy}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white disabled:opacity-60"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  successTick();
                  onQuote?.();
                }}
              >
                {t("sendQuote")}
              </button>
            ) : audience === "staff" && order.state === "waiting" && hideQuoteAction ? (
              <span className="flex-1" />
            ) : audience !== "staff" && order.state === "price" ? (
              <button
                type="button"
                disabled={busy}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white disabled:opacity-60"
                onClick={() => {
                  successTick();
                  onAccept?.();
                }}
              >
                {t("acceptPrice")}
              </button>
            ) : audience !== "staff" && order.state === "done" ? (
              <Link href={order.reviewHref} className="inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-ink">
                {t("leaveReview")}
              </Link>
            ) : (
              <span className="flex-1" />
            )}
            <Link
              href={order.chatHref}
              aria-label={t("openChat")}
              className="inline-flex size-11 items-center justify-center rounded-full text-pf-ink"
            >
              <MessageCircle className="size-5" strokeWidth={2} aria-hidden />
            </Link>
            <button
              type="button"
              aria-label={t("more")}
              className="inline-flex size-11 items-center justify-center rounded-full text-pf-ink"
              onClick={() => setMenu(true)}
            >
              <MoreHorizontal className="size-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : null}
        {when ? <p className="mt-3 text-pf-12 font-medium text-pf-slate-ink">{when}</p> : null}
      </article>
      {sheet ? (
        <OrderSheet
          order={order}
          audience={audience}
          timeLabel={timeLabel}
          weekday={part("weekday")}
          day={part("day")}
          month={part("month")}
          onClose={() => setSheet(false)}
          onOpenPhoto={setViewer}
        />
      ) : null}
      {menu ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-pf-ink/40 p-3" onClick={() => setMenu(false)}>
          <div role="menu" className="w-full max-w-md rounded-[20px] bg-pf-card p-2" onClick={(event) => event.stopPropagation()}>
            <Link href={order.chatHref} className="flex min-h-11 items-center px-3 text-pf-16 text-pf-ink" onClick={() => setMenu(false)}>
              {t("openChat")}
            </Link>
            <button
              type="button"
              className="flex min-h-11 w-full items-center px-3 text-left text-pf-16 text-pf-ink"
              onClick={() => {
                void navigator.clipboard?.writeText(
                  [order.title, order.description, order.whenLabel, order.area, order.shareLocation]
                    .filter(Boolean)
                    .join("\n"),
                );
                setMenu(false);
              }}
            >
              {t("copyDetails")}
            </button>
            <OrderMenuActions order={order} chrome="menu" askCancel={askCancel} onDone={() => setMenu(false)} onCancelClosed={() => setAskCancel(false)} />
          </div>
        </div>
      ) : (
        <OrderMenuActions order={order} chrome="none" askCancel={askCancel} onDone={() => undefined} onCancelClosed={() => setAskCancel(false)} />
      )}
      {viewer != null ? <PhotoViewer photos={order.photos} index={viewer} onClose={() => setViewer(null)} /> : null}
    </div>
  );
}

function StatusMark({ state }: { state: CustomerOrderState }) {
  if (state === "done" || state === "booked") return <Check className="size-3.5" strokeWidth={2.5} aria-hidden />;
  if (state === "cancelled") return <X className="size-3.5" strokeWidth={2.5} aria-hidden />;
  return <span className="size-2 rounded-full bg-pf-navy-600" aria-hidden />;
}

function OrderMenuActions({
  order,
  chrome,
  askCancel,
  onDone,
  onCancelClosed,
}: {
  order: CustomerOrder;
  chrome: "menu" | "none";
  askCancel: boolean;
  onDone: () => void;
  onCancelClosed: () => void;
}) {
  if (order.state === "cancelled" || order.state === "done") return null;
  return (
    <OrderActions
      id={order.id}
      localRequestId={order.localRequestId ?? order.id}
      title={order.title}
      description={order.description}
      whenLabel={order.whenLabel}
      chrome={chrome}
      openCancel={askCancel}
      onCancelClosed={onCancelClosed}
      onChanged={onDone}
    />
  );
}

function OrderSheet({
  order,
  audience,
  timeLabel,
  weekday,
  day,
  month,
  onClose,
  onOpenPhoto,
}: {
  order: CustomerOrder;
  audience: "customer" | "staff";
  timeLabel: string | null;
  weekday: string;
  day: string;
  month: string;
  onClose: () => void;
  onOpenPhoto: (index: number) => void;
}) {
  const { t } = usePros();
  const { locale } = useI18n();
  const events = [
    order.createdAt ? { label: t("statusRequested"), at: order.createdAt } : null,
    order.repliedAt ? { label: t("stepPrice"), at: order.repliedAt } : null,
    order.acceptedAt ? { label: t("cardBooked"), at: order.acceptedAt } : null,
  ].filter((item): item is { label: string; at: string } => item != null);
  const showLocation = Boolean(order.shareLocation) && (audience === "customer" || order.state === "booked" || order.state === "done");
  const price = order.priceLabel?.replace(/\s*THB\b/g, " ฿").replace("–", "-").trim() ?? null;
  const formatAt = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-pf-ink/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-pf-page pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-pf-line bg-pf-card px-4 py-3">
          <h2 id="order-details-title" className="min-w-0 truncate text-pf-18 font-bold tracking-[-0.02em] text-pf-ink">
            {t("orderDetails")}
          </h2>
          <button type="button" aria-label={t("close")} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-pf-ink" onClick={onClose}>
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {order.photos.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto px-4 pt-4">
            {order.photos.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                className="h-40 w-[72%] shrink-0 overflow-hidden rounded-[20px] bg-pf-card shadow-[var(--pf-shadow-1)]"
                onClick={() => onOpenPhoto(index)}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="space-y-3 px-4 pt-4">
          <section className="rounded-[20px] border border-pf-line bg-pf-card p-4 shadow-[var(--pf-shadow-1)]">
            <p className="text-pf-12 font-medium text-pf-slate-ink">{t("editTask")}</p>
            <h3 className="mt-1 text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{order.title}</h3>
            {order.description.trim() ? (
              <p className="mt-3 whitespace-pre-wrap text-pf-16 leading-relaxed text-pf-text-secondary">{order.description}</p>
            ) : null}
            {order.personName.trim() ? (
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-pf-navy-900 text-pf-14 font-medium text-white">
                  {firstName(order.personName).slice(0, 1)}
                </span>
                <span className="text-pf-16 font-medium text-pf-ink">{firstName(order.personName)}</span>
              </div>
            ) : null}
          </section>

          <div className="grid grid-cols-2 gap-3">
            <section className="rounded-[20px] border border-pf-line bg-pf-card p-4 shadow-[var(--pf-shadow-1)]">
              <p className="text-pf-12 font-medium text-pf-slate-ink">{t("preferredDate")}</p>
              <div className="mt-2 flex items-end gap-2 text-pf-ink">
                <span className="text-pf-36 font-extrabold leading-none tracking-[-0.03em] tabular-nums">{day || "—"}</span>
                <span className="pb-1 text-pf-14 font-medium">
                  {[weekday, month].filter(Boolean).join(" ")}
                </span>
              </div>
              {timeLabel ? (
                <p className="mt-2 inline-flex items-center gap-1 text-pf-14 font-medium text-pf-text-secondary">
                  <TimeIcon time={visitDate(order.whenLabel).time} />
                  {shortTime(timeLabel)}
                </p>
              ) : null}
            </section>
            <section className="rounded-[20px] border border-pf-line bg-pf-card p-4 shadow-[var(--pf-shadow-1)]">
              <p className="text-pf-12 font-medium text-pf-slate-ink">{t("place")}</p>
              {order.area ? (
                <p className="mt-2 flex items-start gap-1.5 text-pf-16 font-medium text-pf-ink">
                  <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
                  <span className="min-w-0">{order.area}</span>
                </p>
              ) : (
                <p className="mt-2 text-pf-16 text-pf-text-secondary">—</p>
              )}
            </section>
          </div>

          <section className="rounded-[20px] border border-pf-line bg-pf-card p-4 shadow-[var(--pf-shadow-1)]">
            <p className="text-pf-12 font-medium text-pf-slate-ink">{t("locationShared")}</p>
            {showLocation ? (
              <p className="mt-2 flex items-start gap-1.5 whitespace-pre-wrap text-pf-16 font-medium text-pf-ink">
                <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
                <span className="min-w-0 break-words">{order.shareLocation}</span>
              </p>
            ) : (
              <p className="mt-2 flex items-start gap-1.5 text-pf-16 text-pf-text-secondary">
                <Lock className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
                <span>{audience === "staff" ? t("staffAddressAfter") : t("addressAfter")}</span>
              </p>
            )}
          </section>

          {price || order.quoteNote ? (
            <section className="rounded-[20px] border border-pf-line bg-pf-card p-4 shadow-[var(--pf-shadow-1)]">
              <p className="text-pf-12 font-medium text-pf-slate-ink">{t("price")}</p>
              {price ? <p className="mt-2 text-pf-28 font-bold tabular-nums tracking-[-0.02em] text-pf-ink">{price}</p> : null}
              {order.quoteNote ? (
                <p className="mt-2 whitespace-pre-wrap text-pf-16 leading-relaxed text-pf-text-secondary">{order.quoteNote}</p>
              ) : null}
            </section>
          ) : null}

          {events.length ? (
            <section className="rounded-[20px] border border-pf-line bg-pf-card p-4 shadow-[var(--pf-shadow-1)]">
              <ol className="space-y-3">
                {events.map((event, index) => (
                  <li key={event.label} className="flex gap-3">
                    <span className="relative mt-1.5 flex flex-col items-center">
                      <span className="size-2.5 rounded-full bg-pf-navy-600" />
                      {index < events.length - 1 ? <span className="mt-1 w-px flex-1 bg-pf-line" /> : null}
                    </span>
                    <div className="min-w-0 pb-1">
                      <p className="text-pf-16 font-medium text-pf-ink">{event.label}</p>
                      <p className="mt-0.5 text-pf-12 font-medium text-pf-slate-ink">{formatAt(event.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <Link
            href={order.chatHref}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-pf-navy-600 px-4 text-pf-16 font-medium text-white"
          >
            <MessageCircle className="size-5" strokeWidth={2} aria-hidden />
            {t("openChat")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function PhotoViewer({ photos, index, onClose }: { photos: string[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);
  const src = photos[Math.min(current, photos.length - 1)];
  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-pf-navy-900" role="dialog" aria-modal="true">
      <button type="button" className="m-3 inline-flex size-11 items-center justify-center text-white" onClick={onClose}>
        <X className="size-5" strokeWidth={2} aria-hidden />
      </button>
      {src ? <img src={src} alt="" className="min-h-0 flex-1 object-contain" /> : null}
      {photos.length > 1 ? (
        <div className="flex justify-center gap-2 p-4">
          {photos.map((photo, photoIndex) => (
            <button key={photo} type="button" className="size-11" onClick={() => setCurrent(photoIndex)} aria-label={String(photoIndex + 1)}>
              <span className={cn("mx-auto block size-2 rounded-full", photoIndex === current ? "bg-white" : "bg-white/40")} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function RequestsEmpty({ href }: { href: string }) {
  const { t } = usePros();
  return (
    <div className="rounded-[20px] border border-pf-line bg-pf-card px-4 py-8 text-center">
      <p className="text-[17px] font-bold text-pf-ink">{t("emptyRequests")}</p>
      <Link href={href} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-pf-orange-500 px-5 text-pf-16 font-medium text-white">
        {t("findAPro")}
      </Link>
    </div>
  );
}

export function PaymentNote() {
  const { t } = usePros();
  return (
    <p className="flex items-start gap-2 px-1 pb-16 text-pf-12 leading-relaxed text-pf-slate-ink">
      <Info className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} aria-hidden />
      {t("terms")}
    </p>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[20px] border border-pf-line bg-pf-card p-3 shadow-[var(--pf-shadow-2)]">
      <div className="h-7 w-32 rounded-full bg-pf-page" />
      <div className="mt-3 flex gap-3">
        <div className="size-14 rounded-[14px] bg-pf-page" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-3/4 rounded bg-pf-page" />
          <div className="h-3 w-1/2 rounded bg-pf-page" />
        </div>
      </div>
    </div>
  );
}
