"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { useI18n } from "@/lib/i18n/provider";
import {
  formatLongDateLocalized,
  formatMonthYearLocalized,
  getDateFnsLocale,
} from "@/lib/i18n/date-format";

type DateFieldProps = {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  /** Inclusive lower bound (YYYY-MM-DD). Defaults to today. */
  min?: string;
  placeholder?: string;
  "aria-label"?: string;
};

type PopoverPos = {
  top: number;
  left: number;
  width: number;
};

const POPOVER_WIDTH = 320;
const POPOVER_GAP = 8;

function toDay(iso: string) {
  return startOfDay(parseISO(iso));
}

function toIso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function clampPopover(rect: DOMRect): PopoverPos {
  const width = Math.min(POPOVER_WIDTH, window.innerWidth - 16);
  let left = rect.left;
  if (left + width > window.innerWidth - 8) {
    left = window.innerWidth - 8 - width;
  }
  left = Math.max(8, left);

  const estimatedHeight = 340;
  const spaceBelow = window.innerHeight - rect.bottom - POPOVER_GAP;
  const openAbove = spaceBelow < estimatedHeight && rect.top > spaceBelow;
  const top = openAbove
    ? Math.max(8, rect.top - estimatedHeight - POPOVER_GAP)
    : rect.bottom + POPOVER_GAP;

  return { top, left, width };
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
  const { locale } = useI18n();
  const dfLocale = getDateFnsLocale(locale);
  const autoId = useId();
  const fieldId = id ?? autoId;
  const minIso = min && min.length >= 10 ? min : todayIsoDate();
  const minDay = toDay(minIso);
  const todayIso = todayIsoDate();
  const selected = value && value >= minIso ? toDay(value) : null;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const [cursor, setCursor] = useState(() =>
    value && value >= minIso ? toDay(value) : minDay,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setCursor(value && value >= minIso ? toDay(value) : minDay);
  }, [open, value, minIso, minDay]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = buttonRef.current;
      if (!el) return;
      setPos(clampPopover(el.getBoundingClientRect()));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { locale: dfLocale });
    const end = endOfWeek(endOfMonth(cursor), { locale: dfLocale });
    return eachDayOfInterval({ start, end });
  }, [cursor, dfLocale]);

  const monthLabel = formatMonthYearLocalized(cursor, locale);
  const canGoPrev =
    startOfMonth(cursor).getTime() > startOfMonth(minDay).getTime();
  const display =
    value && value >= minIso
      ? formatLongDateLocalized(toDay(value), locale)
      : placeholder;

  const calendar = open && mounted && pos ? (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={monthLabel}
      style={{ top: pos.top, left: pos.left, width: pos.width }}
      className="fixed z-[80] rounded-2xl bg-white p-3 shadow-[0_12px_40px_rgba(28,28,30,0.18)] ring-1 ring-black/5"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canGoPrev}
          onClick={() => setCursor((c) => addMonths(c, -1))}
          className="flex size-9 items-center justify-center rounded-full text-ink disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-bold text-ink">{monthLabel}</p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="flex size-9 items-center justify-center rounded-full text-ink"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-muted">
        {days.slice(0, 7).map((day) => (
          <span key={toIso(day)} className="truncate px-0.5">
            {format(day, "EEEEE", { locale: dfLocale })}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
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
                "flex h-10 items-center justify-center rounded-full text-sm font-semibold transition",
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
  ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
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

      {calendar ? createPortal(calendar, document.body) : null}
    </div>
  );
}
