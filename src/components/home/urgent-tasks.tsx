"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { TaskWithRelations } from "@/lib/types";
import { formatShortDateLocalized } from "@/lib/i18n/date-format";
import { useI18n } from "@/lib/i18n/provider";
import { localizeDemoText } from "@/lib/demo/localize";
import { LocalizedText } from "@/components/i18n/localized-text";

export function UrgentTasks({
  tasks,
  onClose,
}: {
  tasks: TaskWithRelations[];
  onClose: (id: string) => Promise<void>;
}) {
  const { t, locale } = useI18n();
  if (tasks.length === 0) {
    return (
      <EmptyState
        title={t("tasks.noOpen")}
        description={t("tasks.noOpenHint")}
      />
    );
  }

  return (
    <Card className="overflow-hidden font-sans">
      <div className="border-b border-black/5 px-4 py-3">
        <h2 className="font-sans text-base font-bold text-ink">
          {t("tasks.urgent")}
        </h2>
      </div>
      <ul className="divide-y divide-black/5">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <button
              type="button"
              onClick={() => void onClose(task.id)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary"
              aria-label={`${t("common.done")} ${localizeDemoText(task.title, t)}`}
            >
              <Check className="size-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-[15px] font-semibold text-ink">
                <LocalizedText text={task.title} />
              </p>
              <p className="truncate font-sans text-xs font-medium text-muted">
                {task.villa?.name ?? t("common.general")}
                {task.due_date
                  ? ` · ${t("home.due", { date: formatShortDateLocalized(task.due_date, locale) })}`
                  : ""}
              </p>
            </div>
            <span className="rounded-full bg-danger/10 px-2 py-1 font-sans text-[10px] font-bold uppercase tracking-wide text-danger">
              {t("tasks.urgent")}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
