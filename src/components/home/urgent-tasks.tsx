"use client";

import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { TaskRow } from "@/components/tasks/task-row";
import type { FocusItem } from "@/lib/home/focus-today";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<FocusItem["kind"], MessageKey> = {
  urgent_task: "tasks.urgent",
  due_task: "home.focusDue",
  verify_task: "home.focusVerify",
  job: "home.focusJob",
  checkout: "home.focusCheckout",
  checkin: "home.focusCheckin",
  turnover: "home.focusTurnover",
};

/** Home “Focus of today”: top important task or schedule reminder. */
export function UrgentTasks({
  items,
  onDelete,
}: {
  items: FocusItem[];
  onDelete?: (id: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const focus = items[0];

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
        {items.length > 1 ? (
          <Link
            href={
              focus.kind === "checkout" ||
              focus.kind === "checkin" ||
              focus.kind === "turnover"
                ? "/bookings"
                : focus.kind === "job"
                  ? "/jobs"
                  : "/tasks"
            }
            className="type-meta font-semibold text-primary transition hover:text-primary-dark"
          >
            {t("home.focusTodayMore", { count: items.length - 1 })}
          </Link>
        ) : null}
      </div>
      <div
        className={cn(
          "px-3 py-2.5 md:px-4 md:py-3",
          focus.kind === "urgent_task" || focus.kind === "checkout"
            ? "bg-danger/[0.04]"
            : "bg-primary-soft/30",
        )}
      >
        {focus.task ? (
          <TaskRow
            task={focus.task}
            showUrgentLabel={focus.kind === "urgent_task"}
            trailing={
              onDelete ? (
                <button
                  type="button"
                  className="shrink-0 rounded-full p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
                  aria-label={t("common.delete")}
                  onClick={() => {
                    if (!window.confirm(t("tasks.deleteConfirm"))) return;
                    void onDelete(focus.task!.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null
            }
          />
        ) : (
          <Link
            href={focus.href}
            className="flex items-start gap-2 rounded-xl transition hover:bg-white/50"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <span className="inline-block text-[10px] font-bold uppercase leading-none tracking-wide text-primary">
                {t(KIND_LABEL[focus.kind])}
              </span>
              <p className="font-display text-sm font-bold leading-snug text-ink">
                {focus.title}
              </p>
              {focus.subtitle ? (
                <p className="text-xs text-muted">{focus.subtitle}</p>
              ) : (
                <p className="text-xs text-muted">
                  {focus.kind === "checkout"
                    ? t("home.focusCheckoutHint")
                    : focus.kind === "checkin"
                      ? t("home.focusCheckinHint")
                      : focus.kind === "turnover"
                        ? t("home.focusTurnoverHint")
                        : t("home.focusJobHint")}
                </p>
              )}
            </div>
            <ChevronRight
              className="mt-1 size-4 shrink-0 text-muted"
              aria-hidden
            />
          </Link>
        )}
      </div>
    </Card>
  );
}
