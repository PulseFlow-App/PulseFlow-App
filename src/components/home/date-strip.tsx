"use client";

import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { Villa } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

export function DateStrip({
  villas,
  selected,
  onSelect,
}: {
  villas: Villa[];
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  const { t } = useI18n();
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const eventsFor = (day: Date) =>
    villas.filter(
      (v) =>
        (v.check_in && isSameDay(parseISO(v.check_in), day)) ||
        (v.check_out && isSameDay(parseISO(v.check_out), day)),
    );

  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="font-display text-base font-bold text-ink">
          {t("home.checkInsOuts")}
        </h2>
        <span className="text-xs text-muted">{format(selected, "MMM yyyy")}</span>
      </div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {days.map((day) => {
          const active = isSameDay(day, selected);
          const count = eventsFor(day).length;
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "flex min-w-[52px] flex-col items-center rounded-2xl px-2.5 py-2 transition",
                active
                  ? "bg-primary text-white shadow-sm"
                  : "bg-sand/80 text-ink",
              )}
            >
              <span className="text-[11px] font-semibold opacity-80">
                {format(day, "EEE")}
              </span>
              <span className="font-display text-lg font-bold">
                {format(day, "d")}
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
      <DayEvents day={selected} villas={villas} />
    </Card>
  );
}

function DayEvents({ day, villas }: { day: Date; villas: Villa[] }) {
  const { t } = useI18n();
  const items = villas.flatMap((v) => {
    const rows: { villa: string; kind: string }[] = [];
    if (v.check_in && isSameDay(parseISO(v.check_in), day)) {
      rows.push({ villa: v.name, kind: t("villas.checkIn") });
    }
    if (v.check_out && isSameDay(parseISO(v.check_out), day)) {
      rows.push({ villa: v.name, kind: t("villas.checkOut") });
    }
    return rows;
  });

  if (items.length === 0) {
    return (
      <p className="mt-2 px-1 text-sm text-muted">{t("home.noMoves")}</p>
    );
  }

  return (
    <ul className="mt-2 space-y-1.5 px-1">
      {items.map((item) => (
        <li
          key={`${item.villa}-${item.kind}`}
          className="flex items-center justify-between text-sm"
        >
          <span className="font-semibold text-ink">{item.villa}</span>
          <span className="text-muted">{item.kind}</span>
        </li>
      ))}
    </ul>
  );
}
