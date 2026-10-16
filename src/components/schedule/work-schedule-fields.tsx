"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { formatWorkWindow } from "@/lib/notifications";
import {
  emptyWorkSchedule,
  resolveWorkSchedule,
  type ScheduleMode,
  type WorkRecurrence,
  type WorkScheduleInput,
} from "@/lib/work-schedule";

type Props = {
  value: WorkScheduleInput;
  onChange: (next: WorkScheduleInput) => void;
  /** Label for the date field (tasks: Day, jobs: When). */
  dateLabel?: string;
};

export function WorkScheduleFields({ value, onChange, dateLabel }: Props) {
  const { t } = useI18n();
  const [draftVisit, setDraftVisit] = useState("");

  const set = (patch: Partial<WorkScheduleInput>) =>
    onChange({ ...value, ...patch });

  const addVisit = () => {
    const slot = draftVisit.trim().slice(0, 5);
    if (!/^\d{2}:\d{2}$/.test(slot)) return;
    if (value.visitTimes.includes(slot)) {
      setDraftVisit("");
      return;
    }
    set({
      visitTimes: [...value.visitTimes, slot].sort(),
    });
    setDraftVisit("");
  };

  const resolved = resolveWorkSchedule(value);
  const preview = formatWorkWindow(
    resolved.date,
    resolved.time_start,
    resolved.time_end,
    resolved,
  );

  return (
    <div className="space-y-3">
      <div>
        <Label>{dateLabel ?? t("schedule.startDay")}</Label>
        <Input
          type="date"
          value={value.date}
          onChange={(e) => set({ date: e.target.value })}
        />
      </div>

      <div>
        <Label>{t("schedule.timing")}</Label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(
            [
              ["window", "schedule.window"],
              ["slots", "schedule.visits"],
            ] as const
          ).map(([mode, key]) => (
            <button
              key={mode}
              type="button"
              onClick={() => set({ schedule_mode: mode as ScheduleMode })}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition",
                value.schedule_mode === mode
                  ? "border-primary bg-primary/10 text-ink"
                  : "border-[var(--color-border)] bg-card text-muted",
              )}
            >
              {t(key)}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {value.schedule_mode === "slots"
            ? t("schedule.visitsHint")
            : t("schedule.windowHint")}
        </p>
      </div>

      {value.schedule_mode === "window" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("common.from")}</Label>
            <Input
              type="time"
              value={value.time_start}
              onChange={(e) => set({ time_start: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("common.until")}</Label>
            <Input
              type="time"
              value={value.time_end}
              onChange={(e) => set({ time_end: e.target.value })}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {value.visitTimes.length ? (
            <div className="flex flex-wrap gap-2">
              {value.visitTimes.map((slot) => (
                <span
                  key={slot}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-sand/40 px-2.5 py-1 text-xs font-semibold text-ink"
                >
                  {slot}
                  <button
                    type="button"
                    className="rounded-full p-0.5 text-muted hover:text-danger"
                    aria-label={t("common.remove")}
                    onClick={() =>
                      set({
                        visitTimes: value.visitTimes.filter((s) => s !== slot),
                      })
                    }
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex gap-2">
            <Input
              type="time"
              value={draftVisit}
              onChange={(e) => setDraftVisit(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              reflectGlobalBusy={false}
              onClick={addVisit}
              disabled={!draftVisit}
            >
              <Plus className="size-3.5" />
              {t("schedule.addVisit")}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("schedule.repeat")}</Label>
          <Select
            value={value.recurrence}
            onChange={(e) =>
              set({ recurrence: e.target.value as WorkRecurrence })
            }
          >
            <option value="once">{t("schedule.repeat.once")}</option>
            <option value="daily">{t("schedule.repeat.daily")}</option>
            <option value="weekdays">{t("schedule.repeat.weekdays")}</option>
          </Select>
        </div>
        {value.recurrence !== "once" ? (
          <div>
            <Label>{t("schedule.forDays")}</Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={value.recurrenceCount}
              onChange={(e) =>
                set({
                  recurrenceCount: Math.min(
                    60,
                    Math.max(1, Number(e.target.value) || 1),
                  ),
                })
              }
            />
          </div>
        ) : (
          <div />
        )}
      </div>

      {preview ? (
        <p className="rounded-xl bg-sand/50 px-3 py-2 text-xs font-medium text-ink">
          {t("schedule.preview", { summary: preview })}
        </p>
      ) : null}
    </div>
  );
}

export { emptyWorkSchedule };
