"use client";

import { useState } from "react";
import { ChevronDown, ImageIcon } from "lucide-react";
import { TaskCompleteControl } from "@/components/tasks/task-complete-control";
import { TaskAssigneeMeta } from "@/components/tasks/task-assignee-meta";
import { LocalizedText } from "@/components/i18n/localized-text";
import { formatWorkWindow } from "@/lib/notifications";
import { formatShortDate, cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";

/** Compact task row with expand for full notes + example photo. */
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
  const hasDetails = Boolean(task.notes?.trim() || task.photo_url);
  const schedule =
    formatWorkWindow(task.due_date, task.time_start, task.time_end) ??
    (task.due_date ? formatShortDate(task.due_date) : null);
  const villaLabel = task.villa?.name ?? t("common.general");

  return (
    <div className="space-y-2">
      <TaskCompleteControl
        task={task}
        meta={
          <button
            type="button"
            className={cn(
              "w-full min-w-0 text-left",
              hasDetails && "cursor-pointer",
            )}
            disabled={!hasDetails}
            aria-expanded={hasDetails ? expanded : undefined}
            onClick={() => {
              if (hasDetails) setExpanded((v) => !v);
            }}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-semibold text-ink",
                    doneStyle
                      ? "truncate text-sm line-through opacity-70"
                      : "truncate",
                  )}
                >
                  <LocalizedText text={task.title} />
                </p>
                {!doneStyle ? (
                  showAssignee ? (
                    <TaskAssigneeMeta
                      task={task}
                      villaLabel={villaLabel}
                      schedule={schedule}
                    />
                  ) : (
                    <p className="truncate text-xs text-muted">
                      {villaLabel}
                      {schedule ? ` · ${schedule}` : ""}
                    </p>
                  )
                ) : null}
                {!expanded && task.notes ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                    <LocalizedText text={task.notes} />
                  </p>
                ) : null}
                {!expanded && task.photo_url && !task.notes ? (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <ImageIcon className="size-3.5" />
                    {t("tasks.hasPhoto")}
                  </p>
                ) : null}
              </div>
              {hasDetails ? (
                <ChevronDown
                  className={cn(
                    "mt-0.5 size-4 shrink-0 text-muted transition",
                    expanded && "rotate-180",
                  )}
                />
              ) : null}
            </div>
          </button>
        }
        trailing={trailing}
      />

      {expanded && hasDetails ? (
        <div className="ml-8 space-y-2 rounded-2xl bg-[#F7F5F1] px-3 py-2.5">
          {task.notes ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                {t("common.notes")}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                <LocalizedText text={task.notes} />
              </p>
            </div>
          ) : null}
          {task.photo_url ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                {t("tasks.examplePhoto")}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.photo_url}
                alt=""
                className="mt-1 max-h-56 w-full rounded-xl object-cover"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
