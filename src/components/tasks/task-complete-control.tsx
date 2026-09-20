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
import {
  reviewOfferHref,
  shouldOfferDoerReview,
} from "@/lib/tasks/review-offer";
import { writeStoredReviewOffer } from "@/components/tasks/review-offer-banner";
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
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const direct = canCompleteTaskDirectly(profile.role);
  const canSubmit = canSubmitTaskVerify(profile.role);
  const canApprove = canApproveTaskVerify(profile, task, data.orgKind);
  const canReopen =
    task.status === "done" &&
    (direct || profile.role === "manager");

  const findProfile = (id: string) =>
    data.profiles.find((p) => p.id === id) ??
    data.allProfiles.find((p) => p.id === id);

  const celebrate = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 700);
  };

  /** Offer optional review — banner waits for Yes / Not now before opening profile. */
  const openReviewForDoer = (doerId: string | null | undefined) => {
    if (
      !shouldOfferDoerReview({
        actorRole: profile.role,
        orgKind: data.orgKind,
        doerId,
        actorId: profile.id,
      }) ||
      !doerId
    ) {
      return false;
    }
    const doer = findProfile(doerId);
    const href = reviewOfferHref(doer, doerId);
    writeStoredReviewOffer(task.id, {
      name: doer?.full_name?.trim() || t("tasks.reviewOfferSomeone"),
      href,
    });
    return true;
  };

  const approveAndMaybeReview = async () => {
    const doerId = task.verify_submitted_by ?? task.assigned_to ?? null;
    await data.approveTaskVerify(task.id);
    celebrate();
    openReviewForDoer(doerId);
  };

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
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
    <span className="relative mt-0.5 inline-flex size-5 shrink-0 items-center justify-center">
      <button
        type="button"
        className={cn(
          "relative size-5 rounded-full border-2 border-secondary transition",
          task.status === "done" && "border-0 bg-secondary text-white",
          task.status === "pending_verify" && "border-warning bg-warning/20",
          flash &&
            "border-0 bg-secondary text-white ring-4 ring-secondary/25",
          busy && "opacity-60",
        )}
        aria-label={
          task.status === "done"
            ? t("tasks.reopen")
            : task.status === "pending_verify"
              ? t("tasks.verifyApprove")
              : t("tasks.markDone")
        }
        disabled={
          busy ||
          (task.status === "done" && !canReopen) ||
          (task.status === "pending_verify" && !canApprove)
        }
        onClick={() => {
          if (task.status === "done") {
            if (!canReopen) return;
            void run(() => data.setTaskStatus(task.id, "open"));
            return;
          }
          if (task.status === "pending_verify") {
            if (!canApprove) return;
            void run(() => approveAndMaybeReview());
            return;
          }
          if (direct) {
            void run(async () => {
              const doerId = task.assigned_to;
              await data.setTaskStatus(task.id, "done");
              celebrate();
              openReviewForDoer(doerId);
            });
            return;
          }
          if (canSubmit) setExpanded(true);
        }}
      >
        {(task.status === "done" || flash) && (
          <Check className="absolute inset-0 m-auto size-3" strokeWidth={3} />
        )}
      </button>
    </span>
  );

  return (
    <div className="min-w-0 flex-1 space-y-2 overflow-hidden">
      <div className="flex min-w-0 items-start gap-3">
        {tick}
        <div className="min-w-0 flex-1">{meta}</div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>

      {flash && task.status !== "pending_verify" ? (
        <p className="ml-8 text-xs font-semibold text-secondary">
          {t("tasks.closedFlash")}
        </p>
      ) : null}

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
                onClick={() => void run(() => approveAndMaybeReview())}
              >
                <Check className="size-4" />
                {busy ? t("common.saving") : t("tasks.verifyApprove")}
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
