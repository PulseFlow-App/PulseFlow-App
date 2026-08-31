"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { todayIsoDate } from "@/lib/villas/status-from-dates";

type DateFieldProps = {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  /** Inclusive lower bound (YYYY-MM-DD). Defaults to today. */
  min?: string;
  placeholder?: string;
  "aria-label"?: string;
};

function toDay(iso: string) {
  return startOfDay(parseISO(iso));
}

function toIso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

/** Calendar date picker that never offers days before `min` (defaults to today). */
export function DateField({
  id,
  value,
  onChange,
  min,
  placeholder = "Pick a date",
  "aria-label": ariaLabel,
}: DateFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const minIso = min && min.length >= 10 ? min : todayIsoDate();
  const minDay = toDay(minIso);
  const todayIso = todayIsoDate();
  const selected = value && value >= minIso ? toDay(value) : null;
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() =>
    value && value >= minIso ? toDay(value) : minDay,
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setCursor(value && value >= minIso ? toDay(value) : minDay);
  }, [open, value, minIso, minDay]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && !el.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const monthLabel = format(cursor, "MMMM yyyy");
  const canGoPrev =
    startOfMonth(cursor).getTime() > startOfMonth(minDay).getTime();
  const display =
    value && value >= minIso
      ? format(toDay(value), "MMM d, yyyy")
      : placeholder;

  return (
    <div ref={rootRef} className="relative">
      <button
        id={fieldId}
        type="button"
        aria-label={ariaLabel ?? placeholder}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-2xl border-0 bg-[#F7F5F1] px-4 py-3 text-left text-sm outline-none ring-primary/25 focus:ring-2",
          value && value >= minIso ? "text-ink" : "text-muted",
        )}
      >
        <CalendarDays className="size-4 shrink-0 opacity-60" />
        <span className="truncate">{display}</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={monthLabel}
          className="absolute left-0 right-0 z-40 mt-2 rounded-2xl bg-white p-3 shadow-[0_12px_40px_rgba(28,28,30,0.18)] ring-1 ring-black/5"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              disabled={!canGoPrev}
              onClick={() => setCursor((c) => addMonths(c, -1))}
              className="flex size-8 items-center justify-center rounded-full text-ink disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-bold text-ink">{monthLabel}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="flex size-8 items-center justify-center rounded-full text-ink"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const iso = toIso(day);
              const inMonth = isSameMonth(day, cursor);
              const beforeMin = isBefore(day, minDay);
              const isSelected = selected ? isSameDay(day, selected) : false;
              const isToday = iso === todayIso;
              const disabled = beforeMin;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-full text-xs font-semibold transition",
                    !inMonth && "opacity-35",
                    disabled && "cursor-not-allowed text-muted/40 opacity-40",
                    !disabled && !isSelected && "text-ink hover:bg-[#F7F5F1]",
                    isSelected && "bg-primary text-white hover:bg-primary",
                    !isSelected && isToday && !disabled && "ring-1 ring-primary/40",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
