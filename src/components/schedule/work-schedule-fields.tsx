"use client";

import { Input, Label, Select } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import { formatWorkWindow } from "@/lib/notifications";
import {
  emptyWorkSchedule,
  resolveWorkSchedule,
  type WorkRecurrence,
  type WorkScheduleInput,
} from "@/lib/work-schedule";

type Props = {
  value: WorkScheduleInput;
  onChange: (next: WorkScheduleInput) => void;
};

export function WorkScheduleFields({ value, onChange }: Props) {
  const { t } = useI18n();

  const set = (patch: Partial<WorkScheduleInput>) =>
    onChange({ ...value, ...patch });

  const resolved = resolveWorkSchedule(value);
  const preview = formatWorkWindow(
    resolved.date,
    resolved.time_start,
    resolved.time_end,
    resolved,
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t("schedule.startDay")}</Label>
          <Input
            type="date"
            value={value.date}
            onChange={(e) => set({ date: e.target.value })}
          />
        </div>
        <div>
          <Label>{t("schedule.endDay")}</Label>
          <Input
            type="date"
            value={value.endDate}
            min={value.date || undefined}
            onChange={(e) => set({ endDate: e.target.value })}
          />
        </div>
      </div>

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
