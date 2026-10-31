"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type CalendarExportSource = "airbnb" | "booking" | "guesty";

export const CALENDAR_EXPORT_PLACEHOLDERS: Record<CalendarExportSource, string> =
  {
    airbnb: "https://www.airbnb.com/calendar/ical/….ics?s=…",
    booking: "https://admin.booking.com/…/ical.html?token=…",
    guesty: "https://….guesty.com/….ics",
  };

const SOURCES: {
  id: CalendarExportSource;
  labelKey: MessageKey;
  stepsKey: MessageKey;
}[] = [
  {
    id: "airbnb",
    labelKey: "calendarExport.airbnb",
    stepsKey: "calendarExport.airbnbSteps",
  },
  {
    id: "booking",
    labelKey: "calendarExport.booking",
    stepsKey: "calendarExport.bookingSteps",
  },
  {
    id: "guesty",
    labelKey: "calendarExport.guesty",
    stepsKey: "calendarExport.guestySteps",
  },
];

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** Sync / extra control beside the input */
  action?: ReactNode;
  className?: string;
  inputClassName?: string;
  defaultSource?: CalendarExportSource;
};

export function CalendarExportField({
  value,
  onChange,
  action,
  className,
  inputClassName,
  defaultSource = "airbnb",
}: Props) {
  const { t } = useI18n();
  const [source, setSource] = useState<CalendarExportSource>(defaultSource);
  const [openId, setOpenId] = useState<CalendarExportSource | null>(null);

  const selectSource = (id: CalendarExportSource) => {
    setSource(id);
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{t("villas.icalUrl")}</Label>
      <div className="flex flex-wrap gap-1.5">
        {SOURCES.map((item) => {
          const open = openId === item.id;
          const active = source === item.id;
          return (
            <div key={item.id} className="min-w-0">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => selectSource(item.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition",
                  active
                    ? "bg-sky/20 text-ink ring-1 ring-sky/40"
                    : "bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] text-ink/80 hover:bg-sky/10",
                )}
              >
                {t(item.labelKey)}
                <ChevronDown
                  className={cn(
                    "size-3.5 shrink-0 transition",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            </div>
          );
        })}
      </div>
      {openId ? (
        <p className="pf-panel-soft rounded-xl px-3 py-2 text-xs leading-relaxed text-ink">
          {t(
            SOURCES.find((s) => s.id === openId)?.stepsKey ??
              "calendarExport.airbnbSteps",
          )}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={CALENDAR_EXPORT_PLACEHOLDERS[source]}
          className={cn("min-w-0 flex-1 pl-4", inputClassName)}
          autoComplete="off"
        />
        {action}
      </div>
    </div>
  );
}
