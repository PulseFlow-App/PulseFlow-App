"use client";

import Link from "next/link";
import { addDays, isSameDay, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { Villa, VillaCalendarBooking } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatMonthYear,
  formatWeekdayShort,
} from "@/lib/i18n/date-format";

type MoveRow = {
  key: string;
  villa: string;
  kind: string;
};

export function DateStrip({
  villas,
  calendarBookings = [],
}: {
  villas: Villa[];
  calendarBookings?: VillaCalendarBooking[];
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
        });
      }
      if (v.check_out && isSameDay(parseISO(v.check_out), day)) {
        rows.push({
          key: `out-${v.id}`,
          villa: v.name,
          kind: t("villas.checkOut"),
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
        });
      }
      if (isSameDay(parseISO(b.check_out), day)) {
        rows.push({
          key: `cal-out-${b.id}`,
          villa,
          kind: t("villas.checkOut"),
        });
      }
    }
    return rows;
  };

  const todayMoves = movesFor(today);

  return (
    <Link
      href="/bookings"
      className="block rounded-[var(--radius-card)] outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-sky/40"
      aria-label={t("bookings.title")}
    >
      <Card className="px-3 py-2.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <h2 className="type-section">{t("home.checkInsOuts")}</h2>
          <span className="text-[11px] text-ink/65">
            {formatMonthYear(today, locale)}
          </span>
        </div>
        <div className="-mx-0.5 flex gap-1 overflow-x-auto px-0.5 pb-1">
          {days.map((day) => {
            const active = isSameDay(day, today);
            const count = movesFor(day).length;
            return (
              <span
                key={day.toISOString()}
                className={cn(
                  "flex min-w-[48px] flex-col items-center rounded-xl px-2 py-1.5",
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
              </span>
            );
          })}
        </div>
        {todayMoves.length === 0 ? (
          <p className="mt-1.5 text-sm text-ink/70">{t("home.noMoves")}</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {todayMoves.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between gap-2 px-1 py-1 text-sm"
              >
                <span className="font-semibold text-ink">{item.villa}</span>
                <span className="text-ink/70">{item.kind}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Link>
  );
}
