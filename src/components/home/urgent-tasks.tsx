"use client";

import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import type { FocusItem, FocusTodayBundle } from "@/lib/home/focus-today";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatOrderWhen } from "@/lib/service-orders";
import { LocalizedText } from "@/components/i18n/localized-text";
import { formatWorkWindow } from "@/lib/notifications";
import { formatShortDate } from "@/lib/utils";

const KIND_LABEL: Record<FocusItem["kind"], MessageKey> = {
  urgent_task: "tasks.urgent",
  due_task: "home.focusDue",
  verify_task: "home.focusVerify",
  job: "home.focusJob",
  checkout: "home.focusCheckout",
  checkin: "home.focusCheckin",
  turnover: "home.focusTurnover",
  closed_task: "home.focusClosedTask",
  closed_job: "home.focusClosedJob",
};

function itemMeta(item: FocusItem) {
  if (item.task) {
    const schedule =
      formatWorkWindow(
        item.task.due_date,
        item.task.time_start,
        item.task.time_end,
        {
          schedule_mode: item.task.schedule_mode,
          time_slots: item.task.time_slots,
          recurrence: item.task.recurrence,
          recurrence_count: item.task.recurrence_count,
        },
      ) ?? (item.task.due_date ? formatShortDate(item.task.due_date) : null);
    return [item.subtitle, schedule, item.task.assignee?.full_name]
      .filter(Boolean)
      .join(" · ");
  }
  if (item.order) {
    return [item.subtitle, formatOrderWhen(item.order)]
      .filter(Boolean)
      .join(" · ");
  }
  return item.subtitle ?? "";
}

function FocusLinkRow({
  item,
  onDelete,
}: {
  item: FocusItem;
  onDelete?: (id: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const meta = itemMeta(item);

  return (
    <div className="flex items-start gap-2">
      <Link
        href={item.href}
        className="flex min-w-0 flex-1 items-start gap-2 rounded-xl px-1 py-0.5 transition hover:bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)]"
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <span className="inline-block text-[10px] font-bold uppercase leading-none tracking-wide text-primary">
            {t(KIND_LABEL[item.kind])}
            {item.order?.status === "pending_ack"
              ? ` · ${t("order.status.pending_ack")}`
              : item.task?.status === "pending_verify"
                ? ` · ${t("tasks.verifyPending")}`
                : ""}
          </span>
          <p
            className={cn(
              "text-sm font-semibold leading-snug text-ink line-clamp-2",
              item.closed && "line-through opacity-70",
            )}
          >
            <LocalizedText text={item.title} />
          </p>
          {meta ? (
            <p className="truncate text-[11px] font-medium leading-snug text-ink">
              {meta}
            </p>
          ) : null}
        </div>
        <ChevronRight
          className="mt-1 size-4 shrink-0 text-ink/60"
          aria-hidden
        />
      </Link>
      {onDelete && item.task && !item.closed ? (
        <button
          type="button"
          className="shrink-0 rounded-full p-1.5 text-ink/50 transition hover:bg-danger/10 hover:text-danger"
          aria-label={t("common.delete")}
          onClick={() => {
            if (!window.confirm(t("tasks.deleteConfirm"))) return;
            void onDelete(item.task!.id);
          }}
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

/** Home Focus of today: compact list that opens Jobs/Tasks/Bookings. */
export function UrgentTasks({
  bundle,
  onDelete,
}: {
  bundle: FocusTodayBundle;
  onDelete?: (id: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const open = bundle.open;
  const closed = bundle.closed.slice(0, 5);

  if (open.length === 0 && closed.length === 0) {
    return (
      <Card className="px-3 py-2.5">
        <h2 className="type-section">{t("home.focusToday")}</h2>
        <p className="mt-1 text-sm text-ink/70">{t("home.focusTodayClear")}</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-3 py-2">
        <h2 className="type-section">{t("home.focusToday")}</h2>
      </div>

      {open.length > 0 ? (
        <ul className="divide-y divide-[var(--color-border)]">
          {open.map((item) => (
            <li
              key={item.id}
              className={cn(
                "border-s-4 px-3 py-2",
                item.kind === "urgent_task" || item.kind === "verify_task"
                  ? "border-s-primary bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]"
                  : "border-s-sky bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)]",
              )}
            >
              <FocusLinkRow item={item} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-2 text-sm text-ink/70">
          {t("home.focusOpenClear")}
        </p>
      )}

      {closed.length > 0 ? (
        <details className="border-t border-[var(--color-border)]">
          <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-ink/70 [&::-webkit-details-marker]:hidden">
            {t("home.focusRecentClosed", { count: closed.length })}
          </summary>
          <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {closed.map((item) => (
              <li key={item.id} className="px-3 py-2">
                <FocusLinkRow item={item} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </Card>
  );
}
