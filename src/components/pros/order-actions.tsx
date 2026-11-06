"use client";

import { useEffect, useState } from "react";
import { CANCEL_REASONS, splitCancelReason, type CancelReason } from "@/lib/pros/delivery";
import { usePros } from "@/lib/pros/store";

const TIMES = ["morning", "afternoon", "evening", "any"] as const;

function splitWhen(label: string | null) {
  let date = "";
  let time: (typeof TIMES)[number] = "morning";
  for (const part of (label ?? "").split("·").map((item) => item.trim()).filter(Boolean)) {
    if (/^\d{4}-\d{2}-\d{2}/.test(part)) date = part.slice(0, 10);
    else if ((TIMES as readonly string[]).includes(part.toLowerCase())) time = part.toLowerCase() as (typeof TIMES)[number];
  }
  return { date, time };
}

export function cancelReasonText(
  raw: string | null | undefined,
  t: (key: "cancelSchedule" | "cancelPrice" | "cancelScope" | "cancelNotNeeded" | "cancelOther") => string,
) {
  const parsed = splitCancelReason(raw);
  const label =
    parsed.key === "schedule"
      ? t("cancelSchedule")
      : parsed.key === "price"
        ? t("cancelPrice")
        : parsed.key === "scope"
          ? t("cancelScope")
          : parsed.key === "not_needed"
            ? t("cancelNotNeeded")
            : parsed.key === "other"
              ? t("cancelOther")
              : null;
  return [label, parsed.note].filter(Boolean).join("\n");
}

export function OrderActions({
  id,
  title,
  description,
  whenLabel,
  cancelled,
  onChanged,
  chrome = "buttons",
  openCancel = false,
  onCancelClosed,
}: {
  id: string;
  title: string;
  description: string;
  whenLabel: string | null;
  cancelled?: boolean;
  onChanged: () => void;
  /** buttons keeps the inbox row. menu is text rows. none only opens the dialogs. */
  chrome?: "buttons" | "menu" | "none";
  openCancel?: boolean;
  onCancelClosed?: () => void;
}) {
  const { t } = usePros();
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  useEffect(() => {
    if (openCancel) setCancelOpen(true);
  }, [openCancel]);
  if (cancelled) return null;
  return (
    <>
      {chrome === "buttons" ? (
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-pf-line bg-pf-card px-3 text-pf-14 font-medium text-pf-ink"
            onClick={() => setEditOpen(true)}
          >
            {t("editJob")}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-pf-danger-ink bg-pf-card px-3 text-pf-14 font-medium text-pf-danger-ink"
            onClick={() => setCancelOpen(true)}
          >
            {t("cancelJob")}
          </button>
        </div>
      ) : chrome === "menu" ? (
        <>
          <button type="button" className="flex min-h-11 w-full items-center px-3 text-left text-pf-16 text-pf-ink" onClick={() => setEditOpen(true)}>
            {t("editJob")}
          </button>
          <button
            type="button"
            className="flex min-h-11 w-full items-center px-3 text-left text-pf-16 text-pf-danger-ink"
            onClick={() => setCancelOpen(true)}
          >
            {t("cancelJob")}
          </button>
        </>
      ) : null}
      {editOpen ? (
        <EditJobModal
          open
          id={id}
          title={title}
          description={description}
          whenLabel={whenLabel}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            onChanged();
          }}
        />
      ) : null}
      {cancelOpen ? (
        <CancelJobModal
          open
          id={id}
          onClose={() => {
            setCancelOpen(false);
            onCancelClosed?.();
          }}
          onSaved={() => {
            setCancelOpen(false);
            onCancelClosed?.();
            onChanged();
          }}
        />
      ) : null}
    </>
  );
}

function EditJobModal({
  open,
  id,
  title,
  description,
  whenLabel,
  onClose,
  onSaved,
}: {
  open: boolean;
  id: string;
  title: string;
  description: string;
  whenLabel: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = usePros();
  const initial = splitWhen(whenLabel);
  const [taskTitle, setTaskTitle] = useState(title);
  const [task, setTask] = useState(description);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState<(typeof TIMES)[number]>(initial.time);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const save = async () => {
    if (taskTitle.trim().length < 3 || task.trim().length < 12 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError(t("editNeedDetail"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/services/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "edit",
          title: taskTitle.trim(),
          description: task.trim(),
          whenLabel: `${date} · ${time}`,
        }),
      });
      if (!res.ok) {
        setError(t("couldNotSave"));
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-pf-ink/40 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="edit-job-title" className="w-full max-w-md space-y-3 rounded-[28px] bg-pf-card p-5">
        <h2 id="edit-job-title" className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
          {t("editJobTitle")}
        </h2>
        <input
          value={taskTitle}
          onChange={(event) => setTaskTitle(event.target.value)}
          aria-label={t("editTask")}
          className="min-h-11 w-full rounded-[14px] border border-pf-line bg-pf-page px-3 text-pf-16 text-pf-ink outline-none"
        />
        <textarea
          value={task}
          onChange={(event) => setTask(event.target.value)}
          aria-label={t("editTask")}
          rows={4}
          className="w-full resize-none rounded-[14px] border border-pf-line bg-pf-page px-3 py-2 text-pf-16 text-pf-ink outline-none"
        />
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label={t("preferredDate")}
          className="min-h-11 w-full rounded-[14px] border border-pf-line bg-pf-page px-3 text-pf-16 text-pf-ink outline-none"
        />
        <select
          value={time}
          onChange={(event) => setTime(event.target.value as (typeof TIMES)[number])}
          aria-label={t("preferredTime")}
          className="min-h-11 w-full rounded-[14px] border border-pf-line bg-pf-page px-3 text-pf-16 text-pf-ink outline-none"
        >
          {TIMES.map((item) => (
            <option key={item} value={item}>
              {t(item === "any" ? "anyTime" : item)}
            </option>
          ))}
        </select>
        {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
        <button
          type="button"
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pf-navy-600 px-4 text-pf-16 font-medium text-white disabled:opacity-60"
          onClick={() => void save()}
        >
          {t("editSave")}
        </button>
        <button
          type="button"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
          onClick={onClose}
        >
          {t("permitNotNow")}
        </button>
      </div>
    </div>
  );
}

function CancelJobModal({
  open,
  id,
  onClose,
  onSaved,
}: {
  open: boolean;
  id: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = usePros();
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  const labels: Record<CancelReason, string> = {
    schedule: t("cancelSchedule"),
    price: t("cancelPrice"),
    scope: t("cancelScope"),
    not_needed: t("cancelNotNeeded"),
    other: t("cancelOther"),
  };

  const save = async () => {
    if (!reason) {
      setError(t("cancelNeedReason"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/services/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "cancel",
          reason,
          ...(detail.trim() ? { detail: detail.trim() } : {}),
        }),
      });
      if (!res.ok) {
        setError(t("couldNotSave"));
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-pf-ink/40 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="cancel-job-title" className="w-full max-w-md space-y-3 rounded-[28px] bg-pf-card p-5">
        <h2 id="cancel-job-title" className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
          {t("cancelTitle")}
        </h2>
        <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("cancelHint")}</p>
        <fieldset className="space-y-2">
          <legend className="sr-only">{t("cancelTitle")}</legend>
          {CANCEL_REASONS.map((item) => (
            <label
              key={item}
              className={
                reason === item
                  ? "flex min-h-11 items-center gap-3 rounded-[14px] border border-pf-navy-600 bg-pf-card px-3 text-pf-16 text-pf-ink"
                  : "flex min-h-11 items-center gap-3 rounded-[14px] border border-pf-line bg-pf-card px-3 text-pf-16 text-pf-ink"
              }
            >
              <input
                type="radio"
                name={`cancel-${id}`}
                checked={reason === item}
                onChange={() => {
                  setReason(item);
                  setError(null);
                }}
              />
              {labels[item]}
            </label>
          ))}
        </fieldset>
        <textarea
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          placeholder={t("cancelNotePlaceholder")}
          aria-label={t("cancelNotePlaceholder")}
          rows={2}
          maxLength={280}
          className="w-full resize-none rounded-[14px] border border-pf-line bg-pf-page px-3 py-2 text-pf-16 text-pf-ink outline-none"
        />
        {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
        <button
          type="button"
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-danger-ink bg-pf-card px-4 text-pf-16 font-medium text-pf-danger-ink disabled:opacity-60"
          onClick={() => void save()}
        >
          {t("cancelConfirm")}
        </button>
        <button
          type="button"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
          onClick={onClose}
        >
          {t("permitNotNow")}
        </button>
      </div>
    </div>
  );
}
