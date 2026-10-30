/** Detect PostgREST errors when schedule columns are missing on older DBs. */
export function isMissingScheduleColumnError(message: string): boolean {
  return /schedule_mode|time_slots|recurrence|schema cache/i.test(message);
}

/** Normalize schedule fields before insert (safe for once / empty slots). */
export function normalizeScheduleInsert(input: {
  schedule_mode?: "window" | "slots" | null;
  time_slots?: string[] | null;
  recurrence?: "once" | "daily" | "weekdays" | null;
  recurrence_count?: number | null;
  time_start?: string | null;
  time_end?: string | null;
}) {
  const schedule_mode = input.schedule_mode ?? "window";
  const time_slots = input.time_slots?.length ? input.time_slots : null;
  const recurrence = input.recurrence ?? "once";
  const recurrence_count =
    recurrence === "once"
      ? null
      : Math.min(60, Math.max(1, Math.round(input.recurrence_count ?? 1)));
  return {
    schedule_mode,
    time_slots,
    recurrence,
    recurrence_count,
    time_start: input.time_start?.trim() || null,
    time_end: input.time_end?.trim() || null,
  };
}
