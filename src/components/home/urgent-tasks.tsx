"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TaskWithRelations } from "@/lib/types";
import { formatShortDateLocalized } from "@/lib/i18n/date-format";
import { useI18n } from "@/lib/i18n/provider";
import { localizeDemoText } from "@/lib/demo/localize";
import { LocalizedText } from "@/components/i18n/localized-text";

/** Home “Focus of today”: exactly one top urgent task. */
export function UrgentTasks({
  tasks,
  onClose,
}: {
  tasks: TaskWithRelations[];
  onClose: (id: string) => Promise<void>;
}) {
  const { t, locale } = useI18n();
  const focus = tasks[0];

  if (!focus) {
    return (
      <Card className="px-3 py-3 md:px-4 md:py-4">
        <h2 className="type-section">
          {t("home.focusToday")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("home.focusTodayClear")}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-black/5 px-3 py-2 md:px-4 md:py-3">
        <h2 className="type-section">
          {t("home.focusToday")}
        </h2>
        {tasks.length > 1 ? (
          <Link
            href="/tasks"
            className="type-meta font-semibold text-primary transition hover:text-primary-dark"
          >
            {t("home.focusTodayMore", { count: tasks.length - 1 })}
          </Link>
        ) : null}
      </div>
      <div className="flex items-center gap-3 bg-danger/[0.04] px-3 py-2.5 md:px-4 md:py-3">
        <button
          type="button"
          onClick={() => void onClose(focus.id)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary"
          aria-label={`${t("common.done")} ${localizeDemoText(focus.title, t)}`}
        >
          <Check className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-[0.9375rem] font-semibold text-ink">
            <LocalizedText text={focus.title} />
          </p>
          <p className="truncate font-sans text-xs font-medium text-muted">
            {focus.villa?.name ?? t("common.general")}
            {focus.due_date
              ? ` · ${t("home.due", { date: formatShortDateLocalized(focus.due_date, locale) })}`
              : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-danger/10 px-2 py-1 font-sans text-[10px] font-bold uppercase tracking-wide text-danger">
          {t("tasks.urgent")}
        </span>
      </div>
    </Card>
  );
}
