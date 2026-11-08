"use client";

import { useEffect, useMemo, useState } from "react";
import { CANCEL_REASONS, splitCancelReason, type CancelReason } from "@/lib/pros/delivery";
import { allAreas, areaName } from "@/lib/pros/matching";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";
import {
  buildWhenLabel,
  intervalValid,
  parseWhenLabel,
  type TimeInterval,
} from "@/lib/pros/when-label";

const ISLAND_SLUGS = ["th-phangan", "th-samui", "th-tao"] as const;
const DEFAULT_INTERVAL: TimeInterval = { start: "09:00", end: "12:00" };

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
  localRequestId,
  title,
  description,
  whenLabel,
  area = null,
  shareLocation = null,
  cancelled,
  onChanged,
  chrome = "buttons",
  allowEdit = true,
  openCancel = false,
  openEdit = false,
  onCancelClosed,
  onEditClosed,
}: {
  id: string;
  /** Local marketplace draft id when it differs from the server delivery id. */
  localRequestId?: string | null;
  title: string;
  description: string;
  whenLabel: string | null;
  area?: string | null;
  shareLocation?: string | null;
  cancelled?: boolean;
  onChanged: () => void;
  /** buttons keeps the inbox row. menu is text rows. none only opens the dialogs. */
  chrome?: "buttons" | "menu" | "none";
  allowEdit?: boolean;
  openCancel?: boolean;
  openEdit?: boolean;
  onCancelClosed?: () => void;
  onEditClosed?: () => void;
}) {
  const { t } = usePros();
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  useEffect(() => {
    if (openCancel) setCancelOpen(true);
  }, [openCancel]);
  useEffect(() => {
    if (openEdit && allowEdit) setEditOpen(true);
  }, [allowEdit, openEdit]);
  if (cancelled) return null;
  return (
    <>
      {chrome === "buttons" ? (
        <div className="flex gap-2">
          {allowEdit ? (
            <button
              type="button"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-pf-line bg-pf-card px-3 text-pf-14 font-medium text-pf-ink"
              onClick={() => setEditOpen(true)}
            >
              {t("editJob")}
            </button>
          ) : null}
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
          {allowEdit ? (
            <button type="button" className="flex min-h-11 w-full items-center px-3 text-left text-pf-16 text-pf-ink" onClick={() => setEditOpen(true)}>
              {t("editJob")}
            </button>
          ) : null}
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
          area={area}
          shareLocation={shareLocation}
          onClose={() => {
            setEditOpen(false);
            onEditClosed?.();
          }}
          onSaved={() => {
            setEditOpen(false);
            onEditClosed?.();
            onChanged();
          }}
        />
      ) : null}
      {cancelOpen ? (
        <CancelJobModal
          open
          id={id}
          localRequestId={localRequestId}
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

export function EditJobModal({
  open,
  id,
  title,
  description,
  whenLabel,
  area = null,
  shareLocation = null,
  onClose,
  onSaved,
}: {
  open: boolean;
  id: string;
  title: string;
  description: string;
  whenLabel: string | null;
  area?: string | null;
  shareLocation?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, state } = usePros();
  const { locale } = useI18n();
  const places = useMemo(
    () => allAreas(state).filter((row) => row.level === "locality" || row.level === "district"),
    [state],
  );
  const islands = places.filter(
    (row) => row.level === "locality" && ISLAND_SLUGS.includes(row.slug as (typeof ISLAND_SLUGS)[number]),
  );

  const initial = parseWhenLabel(whenLabel);
  const matched = useMemo(() => matchAreaSelection(places, area, state, locale), [area, locale, places, state]);

  const [taskTitle, setTaskTitle] = useState(title);
  const [task, setTask] = useState(description);
  const [date, setDate] = useState(initial.date);
  const [intervals, setIntervals] = useState<TimeInterval[]>(
    initial.intervals.length
      ? initial.intervals
      : initial.legacyTime && /^\d{2}:\d{2}$/.test(initial.legacyTime)
        ? [{ start: initial.legacyTime, end: "17:00" }]
        : [{ ...DEFAULT_INTERVAL }],
  );
  const [islandId, setIslandId] = useState(matched.islandId);
  const [areaId, setAreaId] = useState(matched.areaId);
  const [location, setLocation] = useState(shareLocation ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const districts = places.filter((row) => row.parentId === islandId && row.level === "district");
  if (!open) return null;

  const areaLabel = (() => {
    if (!areaId) return null;
    const selected = places.find((row) => row.id === areaId);
    if (!selected) return null;
    if (selected.parentId) {
      const island = areaName(state, selected.parentId, locale);
      const district = areaName(state, selected.id, locale);
      return island && district ? `${island} · ${district}` : district || island || null;
    }
    return areaName(state, selected.id, locale) || null;
  })();

  const save = async () => {
    const windows = intervals.filter(intervalValid);
    if (taskTitle.trim().length < 3 || task.trim().length < 12 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError(t("editNeedDetail"));
      return;
    }
    if (!windows.length) {
      setError(t("needWindows"));
      return;
    }
    if (!areaId || !location.trim()) {
      setError(t("needAreaAndLocation"));
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
          whenLabel: buildWhenLabel(date, windows),
          areaLabel,
          shareLocation: location.trim(),
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
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-pf-ink/40 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-job-title"
        className="max-h-[92dvh] w-full max-w-md space-y-3 overflow-y-auto rounded-[28px] bg-pf-card p-5"
      >
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
        <div>
          <p className="mb-1 text-pf-12 font-medium text-pf-slate-ink">{t("preferredWindows")}</p>
          <p className="mb-2 text-pf-12 text-pf-slate-ink">{t("preferredWindowsHint")}</p>
          <div className="space-y-2">
            {intervals.map((interval, index) => (
              <div key={`edit-window-${index}`} className="rounded-[14px] border border-pf-line bg-pf-page p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={interval.start}
                    step={900}
                    aria-label={t("windowFrom")}
                    className="min-h-11 w-full rounded-[14px] border border-pf-line bg-pf-card px-3 text-pf-16 text-pf-ink outline-none"
                    onChange={(event) => {
                      const start = event.target.value || "09:00";
                      setIntervals((current) => current.map((row, item) => (item === index ? { ...row, start } : row)));
                    }}
                  />
                  <input
                    type="time"
                    value={interval.end}
                    step={900}
                    aria-label={t("windowTo")}
                    className="min-h-11 w-full rounded-[14px] border border-pf-line bg-pf-card px-3 text-pf-16 text-pf-ink outline-none"
                    onChange={(event) => {
                      const end = event.target.value || "12:00";
                      setIntervals((current) => current.map((row, item) => (item === index ? { ...row, end } : row)));
                    }}
                  />
                </div>
                {intervals.length > 1 ? (
                  <button
                    type="button"
                    className="mt-2 inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-text-secondary"
                    onClick={() => setIntervals((current) => current.filter((_, item) => item !== index))}
                  >
                    {t("removeInterval")}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-pf-line bg-pf-page px-4 text-pf-14 font-medium text-pf-ink"
            onClick={() => setIntervals((current) => [...current, { start: "14:00", end: "17:00" }])}
          >
            {t("addInterval")}
          </button>
        </div>
        <div>
          <p className="mb-1 text-pf-12 font-medium text-pf-slate-ink">{t("pickIsland")}</p>
          <div className="grid grid-cols-1 gap-2">
            {islands.map((island) => {
              const selected = islandId === island.id;
              return (
                <button
                  key={island.id}
                  type="button"
                  className={
                    selected
                      ? "inline-flex min-h-11 items-center justify-center rounded-full bg-pf-navy-600 px-3 text-pf-14 font-medium text-white"
                      : "inline-flex min-h-11 items-center justify-center rounded-full border border-pf-line bg-pf-page px-3 text-pf-14 font-medium text-pf-ink"
                  }
                  onClick={() => {
                    setIslandId(island.id);
                    setAreaId("");
                  }}
                >
                  {areaName(state, island.id, locale)}
                </button>
              );
            })}
          </div>
        </div>
        {islandId ? (
          <div>
            <p className="mb-1 text-pf-12 font-medium text-pf-slate-ink">{t("pickArea")}</p>
            <div className="flex flex-wrap gap-2">
              {districts.map((row) => {
                const selected = areaId === row.id;
                return (
                  <button
                    key={row.id}
                    type="button"
                    className={
                      selected
                        ? "inline-flex min-h-11 items-center justify-center rounded-full bg-pf-navy-600 px-3 text-pf-14 font-medium text-white"
                        : "inline-flex min-h-11 items-center justify-center rounded-full border border-pf-line bg-pf-page px-3 text-pf-14 font-medium text-pf-ink"
                    }
                    onClick={() => setAreaId(row.id)}
                  >
                    {areaName(state, row.id, locale)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div>
          <p className="mb-1 text-pf-12 font-medium text-pf-slate-ink">{t("shareLocation")}</p>
          <p className="mb-1 text-pf-12 text-pf-slate-ink">{t("shareLocationHint")}</p>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={t("shareLocationPlaceholder")}
            aria-label={t("shareLocation")}
            className="min-h-11 w-full rounded-[14px] border border-pf-line bg-pf-page px-3 text-pf-16 text-pf-ink outline-none"
          />
        </div>
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

function matchAreaSelection(
  places: ReturnType<typeof allAreas>,
  area: string | null | undefined,
  state: Parameters<typeof areaName>[0],
  locale: string,
) {
  if (!area) return { islandId: "", areaId: "" };
  for (const row of places) {
    const name = areaName(state, row.id, locale);
    const parent = row.parentId ? areaName(state, row.parentId, locale) : "";
    if (area === name || (parent && area === `${parent} · ${name}`) || (parent && area.endsWith(` · ${name}`))) {
      if (row.level === "district") return { islandId: row.parentId ?? "", areaId: row.id };
      if (row.level === "locality") return { islandId: row.id, areaId: "" };
    }
  }
  const island = places.find(
    (row) => row.level === "locality" && areaName(state, row.id, locale) && area.startsWith(areaName(state, row.id, locale)),
  );
  return { islandId: island?.id ?? "", areaId: "" };
}

function CancelJobModal({
  open,
  id,
  localRequestId,
  onClose,
  onSaved,
}: {
  open: boolean;
  id: string;
  localRequestId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, setRequestStatus, state } = usePros();
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
      const draftId = localRequestId || id;
      const localOnly = state.requests.some((row) => row.id === draftId);
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
      // Local-only drafts have no server row; still clear them so a new order can start.
      if (!res.ok && !(localOnly && (res.status === 404 || res.status === 400))) {
        setError(t("couldNotSave"));
        return;
      }
      if (localOnly || localRequestId) setRequestStatus(draftId, "cancelled");
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
