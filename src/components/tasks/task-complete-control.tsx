"use client";

import { useRef, useState } from "react";
import { Camera, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import type { TaskWithRelations } from "@/lib/types";
import {
  canApproveTaskVerify,
  canCompleteTaskDirectly,
  canSubmitTaskVerify,
} from "@/lib/tasks/verify";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { cn } from "@/lib/utils";

/** Mark-done / verify / approve control for a task row. */
export function TaskCompleteControl({
  task,
  meta,
  trailing,
}: {
  task: TaskWithRelations;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const data = useData();
  const { t } = useI18n();
  const profile = data.profile;
  const fileRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const direct = canCompleteTaskDirectly(profile.role);
  const canSubmit = canSubmitTaskVerify(profile.role);
  const canApprove = canApproveTaskVerify(profile, task, data.orgKind);
  const canReopen =
    task.status === "done" &&
    (direct || profile.role === "manager");

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const onPickPhoto = async (file: File | null) => {
    if (!file) return;
    await run(async () => {
      const url = await data.uploadChatAttachment(file);
      if (!url) throw new Error(t("common.error"));
      setPhotoUrl(url);
    });
  };

  const tick = (
    <button
      type="button"
      className={cn(
        "mt-0.5 size-5 shrink-0 rounded-full border-2 border-secondary",
        task.status === "done" && "border-0 bg-secondary",
        task.status === "pending_verify" && "border-warning bg-warning/20",
      )}
      aria-label={
        task.status === "done"
          ? t("tasks.reopen")
          : task.status === "pending_verify"
            ? t("tasks.verifyPending")
            : t("tasks.markDone")
      }
      disabled={
        busy ||
        (task.status === "done" && !canReopen) ||
        (task.status === "pending_verify" && !canApprove && !canSubmit)
      }
      onClick={() => {
        if (task.status === "done") {
          if (!canReopen) return;
          void run(() => data.setTaskStatus(task.id, "open"));
          return;
        }
        if (task.status === "pending_verify") return;
        if (direct) {
          void run(() => data.setTaskStatus(task.id, "done"));
          return;
        }
        if (canSubmit) setExpanded(true);
      }}
    />
  );

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <div className="flex items-start gap-3">
        {tick}
        <div className="min-w-0 flex-1">{meta}</div>
        {trailing}
      </div>

      {task.status === "pending_verify" ? (
        <div className="ml-8 space-y-2 rounded-2xl bg-warning/10 px-3 py-2">
          <p className="text-xs font-semibold text-warning-dark">
            {t("tasks.verifyPending")}
          </p>
          {task.verify_notes ? (
            <p className="text-xs text-muted">
              <LocalizedText text={task.verify_notes} />
            </p>
          ) : null}
          {task.verify_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={task.verify_photo_url}
              alt=""
              className="max-h-32 w-full rounded-xl object-cover"
            />
          ) : null}
          {canApprove ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={busy}
                onClick={() => void run(() => data.approveTaskVerify(task.id))}
              >
                <Check className="size-4" />
                {t("tasks.verifyApprove")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => void run(() => data.rejectTaskVerify(task.id))}
              >
                <X className="size-4" />
                {t("tasks.verifyReject")}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted">{t("tasks.verifyWaiting")}</p>
          )}
        </div>
      ) : null}

      {task.status === "open" && expanded && canSubmit ? (
        <div className="ml-8 space-y-2 rounded-2xl bg-[#F7F5F1] p-3">
          <p className="text-xs font-semibold text-ink">
            {t("tasks.verifyTitle")}
          </p>
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("tasks.verifyNotesPlaceholder")}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onPickPhoto(e.target.files?.[0] ?? null)}
          />
          {photoUrl ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt=""
                className="size-14 rounded-lg object-cover"
              />
              <button
                type="button"
                className="text-xs font-semibold text-danger"
                onClick={() => setPhotoUrl(null)}
              >
                {t("common.remove")}
              </button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="size-4" />
              {t("tasks.verifyAddPhoto")}
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await data.submitTaskForVerify(task.id, {
                    notes: notes.trim() || null,
                    photo_url: photoUrl,
                  });
                  setExpanded(false);
                  setNotes("");
                  setPhotoUrl(null);
                })
              }
            >
              {busy ? t("common.saving") : t("tasks.verifySubmit")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setExpanded(false);
                setNotes("");
                setPhotoUrl(null);
                setError(null);
              }}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="ml-8 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
