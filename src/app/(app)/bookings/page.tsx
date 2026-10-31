"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { CalendarExportField } from "@/components/villas/calendar-export-field";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatMonthYear,
  formatWeekdayShort,
} from "@/lib/i18n/date-format";
import { formatShortDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type {
  GuestStay,
  VillaCalendarBooking,
  VillaCalendarSource,
} from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";

const SOURCE_LABEL: Record<VillaCalendarSource, MessageKey> = {
  ical: "bookings.source.ical",
  airbnb: "bookings.source.airbnb",
  booking: "bookings.source.booking",
  vrbo: "bookings.source.vrbo",
  manual: "bookings.source.manual",
};

type CalEvent = {
  id: string;
  villaId: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  label: string;
  kind: "direct" | "channel";
  source?: string;
};

function coversDay(ev: CalEvent, day: Date) {
  const start = startOfDay(parseISO(ev.checkIn));
  const end = startOfDay(parseISO(ev.checkOut));
  const d = startOfDay(day);
  return d >= start && d < end;
}

export default function BookingsPage() {
  const data = useData();
  const { t, locale } = useI18n();
  const router = useRouter();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [villaFilter, setVillaFilter] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectVillaId, setConnectVillaId] = useState("");
  const [connectUrl, setConnectUrl] = useState("");
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectMsg, setConnectMsg] = useState<string | null>(null);
  const [connectErr, setConnectErr] = useState<string | null>(null);

  const canManage =
    data.profile?.role === "owner" || data.profile?.role === "manager";

  useEffect(() => {
    if (!data.ready || !data.profile) return;
    if (!canManage) router.replace("/home");
  }, [data.ready, data.profile, canManage, router]);

  const events = useMemo(() => {
    const villaName = (id: string) =>
      data.villas.find((v) => v.id === id)?.name ?? t("dateRequests.unknownVilla");

    const fromStays: CalEvent[] = data.guestStays
      .filter((s: GuestStay) => s.status === "upcoming" || s.status === "active")
      .map((s) => ({
        id: `stay-${s.id}`,
        villaId: s.villa_id,
        villaName: villaName(s.villa_id),
        checkIn: s.check_in,
        checkOut: s.check_out,
        label: t("bookings.directStay"),
        kind: "direct" as const,
      }));

    const fromChannel: CalEvent[] = data.calendarBookings
      .filter((b: VillaCalendarBooking) => b.status !== "cancelled")
      .map((b) => ({
        id: `cal-${b.id}`,
        villaId: b.villa_id,
        villaName: villaName(b.villa_id),
        checkIn: b.check_in,
        checkOut: b.check_out,
        label:
          b.summary?.trim() ||
          (b.status === "blocked"
            ? t("bookings.blocked")
            : t(SOURCE_LABEL[b.source])),
        kind: "channel" as const,
        source: b.source,
      }));

    const all = [...fromStays, ...fromChannel];
    if (villaFilter === "all") return all;
    return all.filter((e) => e.villaId === villaFilter);
  }, [data.guestStays, data.calendarBookings, data.villas, villaFilter, t]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const dayEvents = useMemo(
    () => events.filter((e) => coversDay(e, selectedDay)),
    [events, selectedDay],
  );

  const villasWithFeed = data.villas.filter((v) => v.ical_import_url);

  useEffect(() => {
    if (!connectVillaId && data.villas[0]) {
      setConnectVillaId(data.villas[0].id);
      setConnectUrl(data.villas[0].ical_import_url ?? "");
    }
  }, [connectVillaId, data.villas]);

  const runConnect = async () => {
    if (!connectVillaId || !connectUrl.trim()) return;
    setConnectBusy(true);
    setConnectErr(null);
    setConnectMsg(null);
    try {
      const result = await data.syncVillaCalendar({
        villaId: connectVillaId,
        feedUrl: connectUrl.trim(),
      });
      setConnectMsg(
        t("bookings.connectOk", {
          count: result.imported + result.updated,
        }),
      );
      setConnectOpen(false);
    } catch (e) {
      setConnectErr(
        e instanceof Error ? e.message : t("bookings.connectFail"),
      );
    } finally {
      setConnectBusy(false);
    }
  };

  if (!data.ready || !data.profile) return <LoadingState />;
  if (!canManage) return <LoadingState />;

  return (
    <div className="space-y-3 animate-rise font-sans">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink">{t("bookings.title")}</h1>
          <p className="text-sm text-ink/70">{t("bookings.subtitle")}</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0"
          onClick={() => {
            setConnectOpen((o) => !o);
            setConnectErr(null);
            setConnectMsg(null);
            const seed =
              data.villas.find((v) => !v.ical_import_url) ?? data.villas[0];
            if (seed) {
              setConnectVillaId(seed.id);
              setConnectUrl(seed.ical_import_url ?? "");
            }
          }}
        >
          {t("bookings.connectFeed")}
        </Button>
      </div>

      {connectOpen ? (
        <Card className="space-y-2.5 p-3">
          <p className="text-sm font-semibold text-ink">
            {t("bookings.connectTitle")}
          </p>
          <p className="text-xs text-ink/70">{t("bookings.connectHint")}</p>
          <div>
            <Label>{t("bookings.allProperties")}</Label>
            <Select
              value={connectVillaId}
              onChange={(e) => {
                const id = e.target.value;
                setConnectVillaId(id);
                const v = data.villas.find((x) => x.id === id);
                setConnectUrl(v?.ical_import_url ?? "");
              }}
            >
              {data.villas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.ical_import_url ? ` · ${t("bookings.feedLinked")}` : ""}
                </option>
              ))}
            </Select>
          </div>
          <CalendarExportField
            value={connectUrl}
            onChange={setConnectUrl}
          />
          {connectErr ? (
            <p className="text-sm font-semibold text-danger">{connectErr}</p>
          ) : null}
          {connectMsg ? (
            <p className="text-sm font-semibold text-sky">{connectMsg}</p>
          ) : null}
          <Button
            size="sm"
            className="w-full"
            busy={connectBusy}
            disabled={!connectVillaId || !connectUrl.trim()}
            onClick={() => void runConnect()}
          >
            {t("villas.icalSync")}
          </Button>
        </Card>
      ) : null}

      {data.villas.length === 0 ? (
        <EmptyState
          title={t("bookings.emptyVillas")}
          description={t("bookings.emptyVillasHint")}
        />
      ) : (
        <>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <Select
              value={villaFilter}
              onChange={(e) => setVillaFilter(e.target.value)}
              className="sm:max-w-xs"
            >
              <option value="all">{t("bookings.allProperties")}</option>
              {data.villas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.ical_import_url ? ` · ${t("bookings.feedLinked")}` : ""}
                </option>
              ))}
            </Select>
            <p className="text-xs text-ink/70">
              {villasWithFeed.length
                ? t("bookings.feedsLinked", { count: villasWithFeed.length })
                : t("bookings.noFeedsYet")}
            </p>
          </div>

          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="rounded-full p-2 text-ink hover:bg-sand"
                aria-label={t("bookings.prevMonth")}
                onClick={() => setCursor((c) => addMonths(c, -1))}
              >
                <ChevronLeft className="size-5" />
              </button>
              <h2 className="font-display text-lg font-bold text-ink">
                {formatMonthYear(cursor, locale)}
              </h2>
              <button
                type="button"
                className="rounded-full p-2 text-ink hover:bg-sand"
                aria-label={t("bookings.nextMonth")}
                onClick={() => setCursor((c) => addMonths(c, 1))}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-ink/65">
              {monthDays.slice(0, 7).map((d) => (
                <div key={`wd-${format(d, "EEEE")}`}>
                  {formatWeekdayShort(d, locale)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const inMonth = isSameMonth(day, cursor);
                const selected = isSameDay(day, selectedDay);
                const count = events.filter((e) => coversDay(e, day)).length;
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(startOfDay(day))}
                    className={cn(
                      "flex min-h-[44px] flex-col items-center rounded-xl px-1 py-1.5 transition",
                      selected
                        ? "bg-[color-mix(in_srgb,var(--color-sky)_18%,transparent)] text-ink ring-1 ring-sky/40"
                        : inMonth
                          ? "bg-canvas-deep/60 text-ink hover:bg-[color-mix(in_srgb,var(--color-sky)_10%,transparent)]"
                          : "text-ink/35",
                    )}
                  >
                    <span
                      className={cn(
                        "font-display text-sm font-bold",
                        inMonth || selected ? "text-ink" : "text-ink/35",
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {count > 0 ? (
                      <span
                        className={cn(
                          "mt-0.5 size-1.5 rounded-full",
                          selected ? "bg-sky" : "bg-primary",
                        )}
                      />
                    ) : (
                      <span className="mt-0.5 size-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-ink/70">
              {formatShortDate(selectedDay.toISOString().slice(0, 10))}
            </h2>
            {dayEvents.length === 0 ? (
              <EmptyState
                title={t("bookings.dayEmpty")}
                description={t("bookings.dayEmptyHint")}
              />
            ) : (
              dayEvents.map((ev) => {
                const dayKey = format(selectedDay, "yyyy-MM-dd");
                const isCheckout = ev.checkOut === dayKey;
                const openTurnover = data.serviceOrders.some(
                  (o) =>
                    o.villa_id === ev.villaId &&
                    o.status !== "done" &&
                    o.status !== "cancelled" &&
                    /turnover|clean/i.test(o.service_type) &&
                    (o.scheduled_date === dayKey || !o.scheduled_date),
                );
                return (
                  <Card key={ev.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-base font-bold text-ink">
                          {ev.villaName}
                        </p>
                        <p className="text-sm text-ink/75">{ev.label}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-ink",
                          ev.kind === "direct"
                            ? "bg-[color-mix(in_srgb,var(--color-sky)_18%,transparent)]"
                            : "bg-[color-mix(in_srgb,var(--color-sun)_22%,transparent)]",
                        )}
                      >
                        {ev.kind === "direct"
                          ? t("bookings.badgeDirect")
                          : t("bookings.badgeChannel")}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-ink/70">
                      {formatShortDate(ev.checkIn)} →{" "}
                      {formatShortDate(ev.checkOut)}
                    </p>
                    {isCheckout ? (
                      <p className="text-xs font-semibold text-warning-dark">
                        {t("bookings.checkoutToday")}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/villas/${ev.villaId}`}
                        className="text-xs font-semibold text-primary"
                      >
                        {t("bookings.openProperty")}
                      </Link>
                      {isCheckout && canManage ? (
                        openTurnover ? (
                          <Link
                            href="/jobs"
                            className="text-xs font-semibold text-sky"
                          >
                            {t("bookings.turnoverOpen")}
                          </Link>
                        ) : (
                          <Link
                            href={`/contacts?bookVilla=${ev.villaId}&date=${dayKey}&service=${encodeURIComponent("Turnover clean")}`}
                            className="text-xs font-semibold text-primary"
                          >
                            {t("bookings.bookTurnover")}
                          </Link>
                        )
                      ) : null}
                    </div>
                  </Card>
                );
              })
            )}
          </section>
        </>
      )}
    </div>
  );
}
