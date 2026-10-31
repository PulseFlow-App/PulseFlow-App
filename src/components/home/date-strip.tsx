"use client";

import Link from "next/link";
import { addDays, isSameDay, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { Villa, VillaCalendarBooking } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatMonthYear,
  formatWeekdayShort,
} from "@/lib/i18n/date-format";

type MoveRow = {
  key: string;
  villa: string;
  kind: string;
  href: string;
};

export function DateStrip({
  villas,
  calendarBookings = [],
  selected,
  onSelect,
}: {
  villas: Villa[];
  calendarBookings?: VillaCalendarBooking[];
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  const { t, locale } = useI18n();
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const movesFor = (day: Date): MoveRow[] => {
    const rows: MoveRow[] = [];
    for (const v of villas) {
      if (v.check_in && isSameDay(parseISO(v.check_in), day)) {
        rows.push({
          key: `in-${v.id}`,
          villa: v.name,
          kind: t("villas.checkIn"),
          href: `/villas/${v.id}`,
        });
      }
      if (v.check_out && isSameDay(parseISO(v.check_out), day)) {
        rows.push({
          key: `out-${v.id}`,
          villa: v.name,
          kind: t("villas.checkOut"),
          href: `/villas/${v.id}`,
        });
      }
    }
    for (const b of calendarBookings) {
      if (b.status === "cancelled") continue;
      const villa =
        villas.find((v) => v.id === b.villa_id)?.name ?? t("bookings.title");
      if (isSameDay(parseISO(b.check_in), day)) {
        rows.push({
          key: `cal-in-${b.id}`,
          villa,
          kind: t("villas.checkIn"),
          href: "/bookings",
        });
      }
      if (isSameDay(parseISO(b.check_out), day)) {
        rows.push({
          key: `cal-out-${b.id}`,
          villa,
          kind: t("villas.checkOut"),
          href: "/bookings",
        });
      }
    }
    return rows;
  };

  return (
    <Card className="px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h2 className="type-section">{t("home.checkInsOuts")}</h2>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink/65">
            {formatMonthYear(selected, locale)}
          </span>
          <Link href="/bookings">
            <Button size="xs" variant="secondary">
              {t("home.openBookingCalendar")}
            </Button>
          </Link>
        </div>
      </div>
      <div className="-mx-0.5 flex gap-1 overflow-x-auto px-0.5 pb-1">
        {days.map((day) => {
          const active = isSameDay(day, selected);
          const count = movesFor(day).length;
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "flex min-w-[48px] flex-col items-center rounded-xl px-2 py-1.5 transition",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "bg-sky-soft/40 text-ink",
              )}
            >
              <span className="text-[10px] font-semibold opacity-90">
                {formatWeekdayShort(day, locale)}
              </span>
              <span className="font-display text-base font-bold leading-tight">
                {day.getDate()}
              </span>
              {count > 0 ? (
                <span
                  className={cn(
                    "mt-0.5 size-1.5 rounded-full",
                    active ? "bg-white" : "bg-primary",
                  )}
                />
              ) : (
                <span className="mt-0.5 size-1.5" />
              )}
            </button>
          );
        })}
      </div>
      <DayEvents moves={movesFor(selected)} />
    </Card>
  );
}

function DayEvents({ moves }: { moves: MoveRow[] }) {
  const { t } = useI18n();

  if (moves.length === 0) {
    return (
      <p className="mt-1.5 text-sm text-ink/70">{t("home.noMoves")}</p>
    );
  }

  return (
    <ul className="mt-1.5 space-y-1">
      {moves.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="flex items-center justify-between gap-2 rounded-lg px-1 py-1 text-sm transition hover:bg-sky-soft/30"
          >
            <span className="font-semibold text-ink">{item.villa}</span>
            <span className="text-ink/70">{item.kind}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
