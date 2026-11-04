"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Check,
  Clock,
  LogIn,
  LogOut,
  Package,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { AppData } from "@/lib/data/types";
import {
  buildToday,
  formatClock,
  type TodayAction,
  type TodayRow,
  type TodayStatus,
  type TodayUrgent,
} from "@/lib/home/today";
import { todayCopy, type TodayCopy } from "@/lib/home/today-copy";
import { isStaffApp } from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function useCopy(): TodayCopy {
  const { locale } = useI18n();
  return todayCopy[locale] ?? todayCopy.en;
}

const KIND_ICON = {
  arrival: LogIn,
  departure: LogOut,
  cleaning: Sparkles,
  maintenance: Wrench,
  delivery: Package,
} as const;

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "bad";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pf-pill px-2 py-1 text-pf-12 font-medium",
        tone === "ok" && "bg-pf-page text-pf-success-ink",
        tone === "warn" && "bg-pf-yellow-300 text-pf-warning-ink",
        tone === "bad" && "bg-pf-peach-100 text-pf-danger-ink",
        tone === "neutral" && "bg-pf-page text-pf-ink",
      )}
    >
      {children}
    </span>
  );
}

function statusTone(status: TodayStatus): "neutral" | "ok" | "warn" | "bad" {
  if (status === "overdue" || status === "needsCheck") return "bad";
  if (status === "pending" || status === "leaving" || status === "arriving")
    return "warn";
  if (status === "agreed") return "ok";
  return "neutral";
}

function StatusIcon({ status }: { status: TodayStatus }) {
  if (status === "agreed") return <Check className="size-3.5" aria-hidden />;
  if (status === "overdue" || status === "pending" || status === "needsCheck")
    return <Clock className="size-3.5" aria-hidden />;
  return <Clock className="size-3.5" aria-hidden />;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((p) => p[0] ?? "").join("");
  return letters.toUpperCase() || "?";
}

export function TodaySkeleton() {
  return (
    <div
      className="font-pf-sans -mx-[var(--shell-pad)] min-h-full space-y-4 bg-pf-page px-[var(--shell-pad)] py-4"
      aria-busy="true"
    >
      <div className="h-10 w-32 rounded-pf-control bg-pf-line" />
      <div className="flex gap-2">
        <div className="h-11 w-28 rounded-pf-pill bg-pf-line" />
        <div className="h-11 w-24 rounded-pf-pill bg-pf-line" />
      </div>
      <div className="h-28 rounded-pf-hero bg-pf-line" />
      <div className="h-40 rounded-pf-card bg-pf-line" />
    </div>
  );
}

export function TodayScreen({ data }: { data: AppData }) {
  const copy = useCopy();
  const staff = data.profile ? isStaffApp(data.profile.role) : false;
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pull, setPull] = useState(0);
  const pullStart = useRef<number | null>(null);

  const model = useMemo(() => {
    if (!data.profile) {
      return {
        rows: [],
        issues: [],
        onDuty: [],
        supplies: [],
        urgent: null,
        photo: null,
      };
    }
    return buildToday({
      propertyId,
      staffId: staff ? data.profile.id : null,
      actor: data.profile,
      villas: data.villas,
      tasks: data.tasks,
      serviceOrders: data.serviceOrders,
      calendarBookings: data.calendarBookings,
      bills: data.bills,
      profiles: data.profiles,
    });
  }, [
    propertyId,
    staff,
    data.profile,
    data.villas,
    data.tasks,
    data.serviceOrders,
    data.calendarBookings,
    data.bills,
    data.profiles,
  ]);

  async function agree(orderId: string) {
    setBusyId(orderId);
    setError(null);
    try {
      await data.agreeServiceOrder(orderId);
    } catch {
      setError(copy.agreeFail);
    } finally {
      setBusyId(null);
    }
  }

  function scrollParent(node: HTMLElement | null) {
    let el = node?.parentElement ?? null;
    while (el) {
      const oy = getComputedStyle(el).overflowY;
      if (oy === "auto" || oy === "scroll") return el;
      el = el.parentElement;
    }
    return null;
  }

  return (
    <div
      className="font-pf-sans -mx-[var(--shell-pad)] min-h-full bg-pf-page px-[var(--shell-pad)] py-4 text-pf-ink"
      onTouchStart={(e) => {
        const parent = scrollParent(e.currentTarget);
        if (parent && parent.scrollTop > 0) return;
        pullStart.current = e.touches[0]?.clientY ?? null;
      }}
      onTouchMove={(e) => {
        if (pullStart.current == null) return;
        const dy = (e.touches[0]?.clientY ?? 0) - pullStart.current;
        setPull(Math.max(0, Math.min(72, dy)));
      }}
      onTouchEnd={() => {
        const should = pull > 56;
        pullStart.current = null;
        setPull(0);
        if (!should) return;
        setError(null);
        void data.refresh().catch(() => setError(copy.refreshFail));
      }}
    >
      {pull > 56 ? (
        <p className="text-pf-text-secondary mb-2 text-center text-pf-14">
          {copy.release}
        </p>
      ) : null}

      <h1 className="text-pf-36 font-extrabold tracking-[-0.03em] text-pf-ink">
        {copy.title}
      </h1>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <PropertyPill
          selected={propertyId === null}
          onClick={() => setPropertyId(null)}
        >
          {copy.all}
        </PropertyPill>
        {data.villas.map((villa) => (
          <PropertyPill
            key={villa.id}
            selected={propertyId === villa.id}
            onClick={() => setPropertyId(villa.id)}
          >
            {villa.name}
          </PropertyPill>
        ))}
      </div>

      {error ? (
        <p className="text-pf-danger-ink mt-3 text-pf-14" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 grid items-start gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.9fr)] lg:gap-4">
        <section className="order-2 self-start lg:order-1">
          {model.rows.length === 0 ? (
            <p className="rounded-pf-card border border-pf-line bg-pf-card px-4 py-4 text-pf-16 text-pf-text-secondary">
              {copy.timelineEmpty}
            </p>
          ) : (
            <ol className="rounded-pf-card border border-pf-line bg-pf-card px-4">
              {model.rows.map((row) => (
                <TimelineRow
                  key={row.id}
                  row={row}
                  copy={copy}
                  busy={busyId === row.orderId}
                  onAgree={agree}
                />
              ))}
            </ol>
          )}
        </section>

        <aside className="order-1 grid grid-cols-2 gap-3 self-start lg:order-2">
          {model.urgent ? (
            <UrgentTile
              urgent={model.urgent}
              copy={copy}
              busy={busyId === model.urgent.orderId}
              onAgree={agree}
            />
          ) : null}
          {model.photo ? (
            <Link
              href={model.photo.href}
              className="col-span-2 overflow-hidden rounded-pf-hero border border-pf-line"
            >
              {/* Real property photo from the villa record. */}
              <img
                src={model.photo.src}
                alt={model.photo.name}
                className="h-36 w-full object-cover"
              />
              <p className="bg-pf-panel text-pf-on-panel px-3 py-2 text-pf-14 font-medium">
                {model.photo.name}
              </p>
            </Link>
          ) : null}
          <section className="col-span-2 rounded-pf-card border border-pf-line bg-pf-card p-3">
            <h2 className="text-pf-18 font-medium text-pf-ink">{copy.issues}</h2>
            {model.issues.length === 0 ? (
              <p className="text-pf-text-secondary mt-2 text-pf-14">
                {copy.issuesEmpty}
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {model.issues.map((issue) => (
                  <li key={issue.id} className="flex items-center gap-3">
                    {issue.photoUrl ? (
                      <button
                        type="button"
                        className="size-11 shrink-0 overflow-hidden rounded-pf-control border border-pf-line"
                        onClick={() => setZoom(issue.photoUrl)}
                        aria-label={copy.zoom}
                      >
                        <img
                          src={issue.photoUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      </button>
                    ) : null}
                    <Link href={issue.href} className="min-w-0 flex-1">
                      <p className="text-pf-16 font-medium text-pf-ink">{issue.title}</p>
                      <p className="text-pf-text-secondary text-pf-14">
                        {issue.property}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {!staff ? (
            <section className="flex flex-col rounded-pf-card border border-pf-line bg-pf-card p-3">
              <h2 className="text-pf-16 font-medium text-pf-ink">{copy.onDuty}</h2>
              {model.onDuty.length === 0 ? (
                <p className="text-pf-text-secondary mt-2 text-pf-14">
                  {copy.dutyEmpty}
                </p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {model.onDuty.map((person) => (
                    <li key={person.id} className="flex items-center gap-2">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-pf-navy-600 text-pf-12 font-medium text-white">
                        {initials(person.name)}
                      </span>
                      <span className="text-pf-14 text-pf-ink">{person.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
          {!staff ? (
            <section className="flex flex-col rounded-pf-card border border-pf-line bg-pf-card p-3">
              <h2 className="text-pf-16 font-medium text-pf-ink">
                {copy.supplies}
              </h2>
              {model.supplies.length === 0 ? (
                <p className="text-pf-text-secondary mt-2 flex-1 text-pf-14">
                  {copy.suppliesEmpty}
                </p>
              ) : (
                <ul className="mt-2 flex-1 space-y-1">
                  {model.supplies.map((item) => (
                    <li key={item.id} className="text-pf-14 text-pf-ink">
                      {item.title}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/bills"
                className="mt-auto inline-flex min-h-11 w-full items-center justify-center rounded-pf-pill border border-pf-line px-3 text-center text-pf-14 font-medium text-balance text-pf-ink"
              >
                {model.supplies.length === 0 ? copy.addSupply : copy.openBills}
              </Link>
            </section>
          ) : null}
        </aside>
      </div>

      {zoom ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-pf-panel/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={copy.zoom}
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label={copy.close}
            onClick={() => setZoom(null)}
          />
          <img
            src={zoom}
            alt=""
            className="relative max-h-[80dvh] max-w-full rounded-pf-card"
          />
        </div>
      ) : null}
    </div>
  );
}

function PropertyPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-11 shrink-0 rounded-pf-pill px-4 text-pf-14 font-medium motion-reduce:transform-none active:scale-[0.98]",
        selected
          ? "bg-pf-ink text-pf-page"
          : "border border-pf-line bg-pf-card text-pf-ink",
      )}
    >
      {children}
    </button>
  );
}

function TimelineRow({
  row,
  copy,
  busy,
  onAgree,
}: {
  row: TodayRow;
  copy: TodayCopy;
  busy: boolean;
  onAgree: (orderId: string) => void;
}) {
  const KindIcon = KIND_ICON[row.kind];
  const statusLabel = copy[row.status];
  return (
    <li className="border-b border-pf-line py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-1.5">
        {row.minutes != null ? (
          <span className="text-pf-14 font-medium tabular-nums text-pf-text-secondary">
            {formatClock(row.minutes)}
          </span>
        ) : null}
        <Chip>
          <KindIcon className="size-3.5" aria-hidden />
          {copy[row.kind]}
        </Chip>
        <Chip tone={statusTone(row.status)}>
          <StatusIcon status={row.status} />
          {statusLabel}
        </Chip>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-pf-16 font-medium text-pf-ink">{row.property}</p>
          {row.title !== "Arrival" && row.title !== "Departure" ? (
            <p className="text-pf-14 text-pf-text-secondary">{row.title}</p>
          ) : null}
        </div>
        <RowAction row={row} copy={copy} busy={busy} onAgree={onAgree} />
      </div>
    </li>
  );
}

function RowAction({
  row,
  copy,
  busy,
  onAgree,
}: {
  row: TodayRow;
  copy: TodayCopy;
  busy: boolean;
  onAgree: (orderId: string) => void;
}) {
  const label = actionLabel(row.action, copy);
  if (row.action === "agree" && row.orderId) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onAgree(row.orderId!)}
        className="inline-flex min-h-11 items-center whitespace-nowrap rounded-pf-pill border border-pf-line bg-pf-card px-4 text-pf-14 font-medium text-pf-ink disabled:opacity-60"
      >
        {label}
      </button>
    );
  }
  return (
    <Link
      href={row.href}
      className="inline-flex min-h-11 items-center whitespace-nowrap rounded-pf-pill border border-pf-line bg-pf-card px-4 text-pf-14 font-medium text-pf-ink"
    >
      {label}
    </Link>
  );
}

function actionLabel(action: TodayAction, copy: TodayCopy) {
  if (action === "agree") return copy.agree;
  if (action === "bookClean") return copy.bookClean;
  return copy.openAction;
}

function UrgentTile({
  urgent,
  copy,
  busy,
  onAgree,
}: {
  urgent: TodayUrgent;
  copy: TodayCopy;
  busy: boolean;
  onAgree: (orderId: string) => void;
}) {
  const className =
    "col-span-2 flex min-h-28 flex-col justify-between rounded-pf-hero bg-pf-orange-500 p-4 text-left text-white motion-reduce:transform-none active:bg-pf-orange-700";
  const body = (
    <>
      <p className="text-pf-14 font-medium">{copy.doNext}</p>
      <p className="mt-1 text-pf-22 font-bold tracking-[-0.02em]">{urgent.title}</p>
      <p className="mt-1 text-pf-16">{urgent.property}</p>
    </>
  );
  if (urgent.action === "agree" && urgent.orderId) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onAgree(urgent.orderId!)}
        className={className}
      >
        {body}
      </button>
    );
  }
  return (
    <Link href={urgent.href} className={className}>
      {body}
    </Link>
  );
}
