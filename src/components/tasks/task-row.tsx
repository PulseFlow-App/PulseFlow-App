"use client";

import { useState } from "react";
import { ChevronDown, ImageIcon } from "lucide-react";
import { TaskCompleteControl } from "@/components/tasks/task-complete-control";
import { LocalizedText } from "@/components/i18n/localized-text";
import { formatWorkWindow } from "@/lib/notifications";
import { formatShortDate, cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";

/** Compact task row — tap the body to expand notes, photo, and details. */
export function TaskRow({
  task,
  trailing,
  showAssignee = true,
  doneStyle = false,
  /** When false, skip the inline URGENT label (e.g. Focus of today already implies it). */
  showUrgentLabel = true,
}: {
  task: TaskWithRelations;
  trailing?: React.ReactNode;
  showAssignee?: boolean;
  doneStyle?: boolean;
  showUrgentLabel?: boolean;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const schedule =
    formatWorkWindow(task.due_date, task.time_start, task.time_end, {
      schedule_mode: task.schedule_mode,
      time_slots: task.time_slots,
      recurrence: task.recurrence,
      recurrence_count: task.recurrence_count,
    }) ?? (task.due_date ? formatShortDate(task.due_date) : null);
  const villaLabel = task.villa?.name ?? t("common.general");
  const hasNotes = Boolean(task.notes?.trim());
  const hasPhoto = Boolean(task.photo_url);
  const urgent = showUrgentLabel && !doneStyle && task.priority === "urgent";

  return (
    <div className="space-y-1.5">
      <TaskCompleteControl
        task={task}
        meta={
          <button
            type="button"
            className="w-full min-w-0 text-left"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="flex items-start gap-1.5">
              <div className="min-w-0 flex-1 space-y-0.5">
                {urgent ? (
                  <span className="inline-block text-[10px] font-bold uppercase leading-none tracking-wide text-danger">
                    {t("tasks.urgent")}
                  </span>
                ) : null}
                <p
                  className={cn(
                    "text-sm font-semibold leading-snug text-ink break-words",
                    doneStyle && "line-through opacity-70",
                    !expanded && "line-clamp-2",
                  )}
                >
                  <LocalizedText text={task.title} />
                </p>
                {!doneStyle ? (
                  <p className="truncate text-[11px] leading-snug text-muted">
                    {villaLabel}
                    {schedule ? ` · ${schedule}` : ""}
                    {showAssignee && task.assignee
                      ? ` · ${task.assignee.full_name}`
                      : ""}
                  </p>
                ) : null}
                {!expanded && hasNotes ? (
                  <p className="line-clamp-1 text-[11px] text-muted">
                    <LocalizedText text={task.notes!} />
                  </p>
                ) : null}
                {!expanded && hasPhoto ? (
                  <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <ImageIcon className="size-3" />
                    {t("tasks.hasPhoto")}
                  </p>
                ) : null}
              </div>
              <ChevronDown
                className={cn(
                  "mt-0.5 size-3.5 shrink-0 text-muted transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </div>
          </button>
        }
        trailing={trailing}
      />

      {expanded ? (
        <div className="ml-6 space-y-2.5 rounded-xl border border-black/5 bg-canvas-deep px-2.5 py-2.5">
          <div className="grid gap-2 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                {t("tasks.villa")}
              </p>
              <p className="text-ink">{villaLabel}</p>
            </div>
            {schedule ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  {t("tasks.day")}
                </p>
                <p className="text-ink">{schedule}</p>
              </div>
            ) : null}
            {showAssignee && task.assignee ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  {t("tasks.assignee")}
                </p>
                <p className="text-ink">{task.assignee.full_name}</p>
              </div>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
              {t("common.notes")}
            </p>
            {hasNotes ? (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                <LocalizedText text={task.notes!} />
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">{t("tasks.noNotes")}</p>
            )}
          </div>
          {hasPhoto ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                {t("tasks.examplePhoto")}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.photo_url!}
                alt=""
                className="mt-1 max-h-72 w-full rounded-xl object-cover"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
