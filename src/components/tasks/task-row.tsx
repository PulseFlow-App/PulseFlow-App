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
}: {
  task: TaskWithRelations;
  trailing?: React.ReactNode;
  showAssignee?: boolean;
  doneStyle?: boolean;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const schedule =
    formatWorkWindow(task.due_date, task.time_start, task.time_end) ??
    (task.due_date ? formatShortDate(task.due_date) : null);
  const villaLabel = task.villa?.name ?? t("common.general");
  const hasNotes = Boolean(task.notes?.trim());
  const hasPhoto = Boolean(task.photo_url);

  return (
    <div className="space-y-2">
      <TaskCompleteControl
        task={task}
        meta={
          <button
            type="button"
            className="w-full min-w-0 text-left"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p
                  className={cn(
                    "font-semibold text-ink",
                    doneStyle && "text-sm line-through opacity-70",
                    !expanded && "truncate",
                    expanded && "whitespace-normal break-words",
                  )}
                >
                  <LocalizedText text={task.title} />
                </p>
                {!doneStyle ? (
                  <p className="truncate text-xs text-muted">
                    {villaLabel}
                    {schedule ? ` · ${schedule}` : ""}
                    {showAssignee && task.assignee
                      ? ` · ${task.assignee.full_name}`
                      : ""}
                  </p>
                ) : null}
                {!expanded && hasNotes ? (
                  <p className="line-clamp-1 text-xs text-muted">
                    <LocalizedText text={task.notes!} />
                  </p>
                ) : null}
                {!expanded && hasPhoto ? (
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <ImageIcon className="size-3.5" />
                    {t("tasks.hasPhoto")}
                  </p>
                ) : null}
              </div>
              <ChevronDown
                className={cn(
                  "mt-0.5 size-4 shrink-0 text-muted transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </div>
          </button>
        }
        trailing={trailing}
      />

      {expanded ? (
        <div className="ml-8 space-y-3 rounded-2xl border border-black/5 bg-[#F7F5F1] px-3 py-3">
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
