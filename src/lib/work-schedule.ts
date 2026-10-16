/** Shared timing model for tasks and service orders. */

export type ScheduleMode = "window" | "slots";
export type WorkRecurrence = "once" | "daily" | "weekdays";

export type WorkScheduleInput = {
  schedule_mode: ScheduleMode;
  /** YYYY-MM-DD start (or only) day */
  date: string;
  time_start: string;
  time_end: string;
  /** Discrete visit times when mode is slots */
  visitTimes: string[];
  recurrence: WorkRecurrence;
  /** How many calendar days in the series (daily/weekdays). Ignored for once. */
  recurrenceCount: number;
};

export type WorkScheduleFields = {
  schedule_mode: ScheduleMode;
  time_slots: string[] | null;
  recurrence: WorkRecurrence;
  recurrence_count: number | null;
  time_start: string | null;
  time_end: string | null;
  date: string | null;
};

export function emptyWorkSchedule(defaults?: Partial<WorkScheduleInput>): WorkScheduleInput {
  return {
    schedule_mode: "window",
    date: "",
    time_start: "",
    time_end: "",
    visitTimes: [],
    recurrence: "once",
    recurrenceCount: 7,
    ...defaults,
  };
}

function normalizeTime(value: string): string {
  return value.trim().slice(0, 5);
}

/** Normalize form state into DB-ready schedule fields. */
export function resolveWorkSchedule(input: WorkScheduleInput): WorkScheduleFields {
  const date = input.date.trim() || null;
  const recurrence =
    input.recurrence === "once" || !date ? "once" : input.recurrence;
  const recurrence_count =
    recurrence === "once"
      ? null
      : Math.min(60, Math.max(1, Math.round(input.recurrenceCount) || 7));

  if (input.schedule_mode === "slots") {
    const slots = Array.from(
      new Set(
        input.visitTimes
          .map(normalizeTime)
          .filter((t) => /^\d{2}:\d{2}$/.test(t)),
      ),
    ).sort();
    return {
      schedule_mode: "slots",
      time_slots: slots.length ? slots : null,
      recurrence,
      recurrence_count,
      time_start: slots[0] ?? null,
      time_end: null,
      date,
    };
  }

  const time_start = normalizeTime(input.time_start) || null;
  const time_end = normalizeTime(input.time_end) || null;
  return {
    schedule_mode: "window",
    time_slots: null,
    recurrence,
    recurrence_count,
    time_start,
    time_end,
    date,
  };
}

export function schedulePayloadFromResolved(resolved: WorkScheduleFields) {
  return {
    schedule_mode: resolved.schedule_mode,
    time_slots: resolved.time_slots,
    recurrence: resolved.recurrence,
    recurrence_count: resolved.recurrence_count,
    time_start: resolved.time_start,
    time_end: resolved.time_end,
  };
}

/** Fill schedule columns for older rows / demo seeds. */
export function withScheduleDefaults<
  T extends {
    schedule_mode?: ScheduleMode | null;
    time_slots?: string[] | null;
    recurrence?: WorkRecurrence | null;
    recurrence_count?: number | null;
  },
>(
  row: T,
): T & {
  schedule_mode: ScheduleMode;
  time_slots: string[] | null;
  recurrence: WorkRecurrence;
  recurrence_count: number | null;
} {
  return {
    ...row,
    schedule_mode: row.schedule_mode ?? "window",
    time_slots: row.time_slots ?? null,
    recurrence: row.recurrence ?? "once",
    recurrence_count: row.recurrence_count ?? null,
  };
}
