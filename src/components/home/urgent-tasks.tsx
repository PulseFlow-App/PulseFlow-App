"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TaskWithRelations } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";
import { TaskRow } from "@/components/tasks/task-row";

/** Home “Focus of today”: exactly one top urgent task. */
export function UrgentTasks({
  tasks,
  onDelete,
}: {
  tasks: TaskWithRelations[];
  onDelete?: (id: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const focus = tasks[0];

  if (!focus) {
    return (
      <Card className="px-3 py-3 md:px-4 md:py-4">
        <h2 className="type-section">{t("home.focusToday")}</h2>
        <p className="mt-1 text-sm text-muted">{t("home.focusTodayClear")}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-black/5 px-3 py-2 md:px-4 md:py-3">
        <h2 className="type-section">{t("home.focusToday")}</h2>
        {tasks.length > 1 ? (
          <Link
            href="/tasks"
            className="type-meta font-semibold text-primary transition hover:text-primary-dark"
          >
            {t("home.focusTodayMore", { count: tasks.length - 1 })}
          </Link>
        ) : null}
      </div>
      <div className="bg-danger/[0.04] px-3 py-2.5 md:px-4 md:py-3">
        <TaskRow
          task={focus}
          trailing={
            <>
              <span className="shrink-0 rounded-full bg-danger/10 px-2 py-1 font-sans text-[10px] font-bold uppercase tracking-wide text-danger">
                {t("tasks.urgent")}
              </span>
              {onDelete ? (
                <button
                  type="button"
                  className="shrink-0 rounded-full p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
                  aria-label={t("common.delete")}
                  onClick={() => {
                    if (!window.confirm(t("tasks.deleteConfirm"))) return;
                    void onDelete(focus.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </>
          }
        />
      </div>
    </Card>
  );
}
