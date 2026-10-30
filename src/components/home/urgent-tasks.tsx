"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { TaskRow } from "@/components/tasks/task-row";
import { JobProgressTimeline } from "@/components/jobs/job-progress-timeline";
import { useData } from "@/lib/data/use-app-data";
import type { FocusItem, FocusTodayBundle } from "@/lib/home/focus-today";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatOrderWhen } from "@/lib/service-orders";

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

function downloadTaskReports(
  bundle: FocusTodayBundle,
  profiles: { id: string; full_name: string }[],
  filename: string,
) {
  const nameOf = (id: string | null | undefined) =>
    (id && profiles.find((p) => p.id === id)?.full_name) || "";
  const rows: string[][] = [
    [
      "Type",
      "Title",
      "Property",
      "Status",
      "Assignee",
      "When",
      "Closed",
    ],
  ];
  const pushTask = (item: FocusItem) => {
    const task = item.task;
    if (!task) return;
    rows.push([
      "Task",
      task.title,
      task.villa?.name ?? "",
      task.status,
      task.assignee?.full_name ?? nameOf(task.assigned_to),
      task.due_date ?? "",
      task.completed_at ?? "",
    ]);
  };
  const pushJob = (item: FocusItem) => {
    const order = item.order;
    if (!order) return;
    rows.push([
      "Job",
      order.service_type,
      order.location_label ?? "",
      order.status,
      nameOf(order.staff_profile_id),
      formatOrderWhen(order),
      order.completed_at ?? "",
    ]);
  };
  for (const item of [...bundle.open, ...bundle.closed]) {
    if (item.task) pushTask(item);
    if (item.order) pushJob(item);
  }
  const csv = rows
    .map((r) =>
      r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function FocusJobRow({
  item,
  defaultOpen = false,
}: {
  item: FocusItem;
  defaultOpen?: boolean;
}) {
  const { t } = useI18n();
  const data = useData();
  const [expanded, setExpanded] = useState(defaultOpen);
  const order = item.order;
  const profiles = useMemo(
    () => [
      ...data.profiles,
      ...data.allProfiles.filter(
        (p) => !data.profiles.some((x) => x.id === p.id),
      ),
    ],
    [data.profiles, data.allProfiles],
  );
  if (!order) return null;

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        className="flex w-full min-w-0 items-start gap-2 text-left"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <span className="inline-block text-[10px] font-bold uppercase leading-none tracking-wide text-primary">
            {t(KIND_LABEL[item.kind])}
            {order.status === "pending_ack"
              ? ` · ${t("order.status.pending_ack")}`
              : order.status === "agreed"
                ? ` · ${t("order.status.agreed")}`
                : order.status === "done"
                  ? ` · ${t("order.status.done")}`
                  : ""}
          </span>
          <p
            className={cn(
              "font-display text-sm font-bold leading-snug text-ink",
              item.closed && "line-through opacity-70",
            )}
          >
            {item.title}
          </p>
          {!expanded ? (
            <p className="truncate text-[11px] leading-snug text-ink/65">
              {[item.subtitle, formatOrderWhen(order)].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "mt-0.5 size-3.5 shrink-0 text-muted transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded ? (
        <div className="overflow-hidden rounded-xl border border-black/5 bg-card">
          <JobProgressTimeline
            order={order}
            profiles={profiles}
            bills={data.bills}
            defaultOpen
          />
          <div className="border-t border-black/5 px-3 py-2">
            <Link
              href={item.href}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              {t("home.focusOpenInJobs")}
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ScheduleChip({ item }: { item: FocusItem }) {
  const { t } = useI18n();
  return (
    <Link
      href={item.href}
      className="flex min-w-[9.5rem] shrink-0 flex-col gap-1 rounded-2xl border border-[var(--color-border)] bg-card px-3 py-2.5 transition hover:border-primary/40"
    >
      <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
        {t(KIND_LABEL[item.kind])}
      </span>
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
        {item.title}
      </span>
      <span className="text-[11px] text-ink/65">
        {item.subtitle ||
          (item.kind === "checkout"
            ? t("home.focusCheckoutHint")
            : item.kind === "checkin"
              ? t("home.focusCheckinHint")
              : t("home.focusTurnoverHint"))}
      </span>
    </Link>
  );
}

/** Home “Focus of today”: open work first, then schedule, then recent closed. */
export function UrgentTasks({
  bundle,
  onDelete,
}: {
  bundle: FocusTodayBundle;
  onDelete?: (id: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const data = useData();
  const [showClosed, setShowClosed] = useState(false);

  const open = bundle.open;
  const closed = bundle.closed;
  const schedule = bundle.schedule;

  if (open.length === 0 && schedule.length === 0 && closed.length === 0) {
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
        <Button
          size="xs"
          variant="ghost"
          className="shrink-0"
          onClick={() =>
            downloadTaskReports(
              bundle,
              [...data.profiles, ...data.allProfiles],
              `pulseflow-task-reports-${new Date().toISOString().slice(0, 10)}.csv`,
            )
          }
        >
          <Download className="size-3.5" />
          {t("home.downloadTaskReports")}
        </Button>
      </div>

      {open.length > 0 ? (
        <ul className="divide-y divide-black/5">
          {open.map((item) => (
            <li
              key={item.id}
              className={cn(
                "px-3 py-2.5 md:px-4 md:py-3",
                item.kind === "urgent_task" || item.kind === "verify_task"
                  ? "bg-danger/[0.03]"
                  : "bg-primary-soft/20",
              )}
            >
              {item.task ? (
                <TaskRow
                  task={item.task}
                  showUrgentLabel={item.kind === "urgent_task"}
                  collapseStatus
                  trailing={
                    onDelete ? (
                      <button
                        type="button"
                        className="shrink-0 rounded-full p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
                        aria-label={t("common.delete")}
                        onClick={() => {
                          if (!window.confirm(t("tasks.deleteConfirm"))) return;
                          void onDelete(item.task!.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null
                  }
                />
              ) : item.order ? (
                <FocusJobRow item={item} />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-3 py-3 text-sm text-muted md:px-4">
          {t("home.focusOpenClear")}
        </p>
      )}

      {schedule.length > 0 ? (
        <div className="border-t border-black/5 px-3 py-3 md:px-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              {t("home.focusScheduleStrip")}
            </p>
            <Link
              href="/bookings"
              className="text-[11px] font-semibold text-primary"
            >
              {t("home.focusAllBookings")}
            </Link>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {schedule.map((item) => (
              <ScheduleChip key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}

      {closed.length > 0 ? (
        <div className="border-t border-black/5">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left md:px-4"
            onClick={() => setShowClosed((v) => !v)}
          >
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              {t("home.focusRecentClosed", { count: closed.length })}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 text-muted transition-transform",
                showClosed && "rotate-180",
              )}
            />
          </button>
          {showClosed ? (
            <ul className="divide-y divide-black/5 border-t border-black/5">
              {closed.map((item) => (
                <li key={item.id} className="px-3 py-2.5 md:px-4 md:py-3">
                  {item.task ? (
                    <TaskRow
                      task={item.task}
                      doneStyle
                      collapseStatus
                      showUrgentLabel={false}
                    />
                  ) : item.order ? (
                    <FocusJobRow item={item} />
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
