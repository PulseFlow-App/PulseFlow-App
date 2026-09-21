"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { StarsPicker } from "@/components/endorsements/stars";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";

const STORAGE_PREFIX = "pf-review-offer:";
const DRAFT_NOTE_KEY = "pf-review-draft-note";
const DRAFT_PHOTO_KEY = "pf-review-draft-photo";
const DRAFT_WORK_KEY = "pf-review-draft-work";
export const REVIEW_OFFER_EVENT = "pf-review-offer";

export type StoredReviewOffer = {
  taskId: string;
  name: string;
  href: string;
  toProfileId: string;
  /** Task title or job type shown as context. */
  workLabel?: string;
  /** Draft note about this job/task (optional). */
  jobNote?: string;
  /** Draft result photo URL (optional). */
  photoUrl?: string;
};

export function reviewOfferStorageKey(taskId: string) {
  return `${STORAGE_PREFIX}${taskId}`;
}

export function readAnyStoredReviewOffer(): StoredReviewOffer | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as {
        name?: string;
        href?: string;
        toProfileId?: string;
        workLabel?: string;
        jobNote?: string;
        photoUrl?: string;
      };
      if (!parsed?.href || !parsed?.name || !parsed?.toProfileId) continue;
      return {
        taskId: key.slice(STORAGE_PREFIX.length),
        name: parsed.name,
        href: parsed.href,
        toProfileId: parsed.toProfileId,
        workLabel: parsed.workLabel?.trim() || undefined,
        jobNote: parsed.jobNote ?? "",
        photoUrl: parsed.photoUrl ?? undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredReviewOffer(
  taskId: string,
  offer: {
    name: string;
    href: string;
    toProfileId: string;
    workLabel?: string | null;
    jobNote?: string | null;
    photoUrl?: string | null;
  },
) {
  try {
    sessionStorage.setItem(
      reviewOfferStorageKey(taskId),
      JSON.stringify({
        name: offer.name,
        href: offer.href,
        toProfileId: offer.toProfileId,
        workLabel: offer.workLabel?.trim() || undefined,
        jobNote: offer.jobNote ?? "",
        photoUrl: offer.photoUrl?.trim() || undefined,
      }),
    );
    window.dispatchEvent(new Event(REVIEW_OFFER_EVENT));
  } catch {
    /* ignore quota */
  }
}

export function clearStoredReviewOffer(taskId: string) {
  try {
    sessionStorage.removeItem(reviewOfferStorageKey(taskId));
    window.dispatchEvent(new Event(REVIEW_OFFER_EVENT));
  } catch {
    /* ignore */
  }
}

/** Pass note / photo / work label from the banner into the profile review form. */
export function writeReviewDraft(input: {
  note: string;
  photoUrl?: string | null;
  workLabel?: string | null;
}) {
  try {
    const note = input.note.trim();
    if (note) sessionStorage.setItem(DRAFT_NOTE_KEY, note);
    else sessionStorage.removeItem(DRAFT_NOTE_KEY);
    const photo = input.photoUrl?.trim();
    if (photo) sessionStorage.setItem(DRAFT_PHOTO_KEY, photo);
    else sessionStorage.removeItem(DRAFT_PHOTO_KEY);
    const work = input.workLabel?.trim();
    if (work) sessionStorage.setItem(DRAFT_WORK_KEY, work);
    else sessionStorage.removeItem(DRAFT_WORK_KEY);
  } catch {
    /* ignore */
  }
}

export function takeReviewDraft(): {
  note: string;
  photoUrl: string | null;
  workLabel: string | null;
} {
  if (typeof window === "undefined") {
    return { note: "", photoUrl: null, workLabel: null };
  }
  try {
    const note = sessionStorage.getItem(DRAFT_NOTE_KEY) ?? "";
    const photoUrl = sessionStorage.getItem(DRAFT_PHOTO_KEY);
    const workLabel = sessionStorage.getItem(DRAFT_WORK_KEY);
    sessionStorage.removeItem(DRAFT_NOTE_KEY);
    sessionStorage.removeItem(DRAFT_PHOTO_KEY);
    sessionStorage.removeItem(DRAFT_WORK_KEY);
    return {
      note,
      photoUrl: photoUrl?.trim() || null,
      workLabel: workLabel?.trim() || null,
    };
  } catch {
    return { note: "", photoUrl: null, workLabel: null };
  }
}

/** @deprecated use writeReviewDraft */
export function writeReviewDraftNote(note: string) {
  writeReviewDraft({ note });
}

/** @deprecated use takeReviewDraft */
export function takeReviewDraftNote(): string {
  return takeReviewDraft().note;
}

/** Survives task rows disappearing after confirm-done. */
export function ReviewOfferBanner() {
  const data = useData();
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [offer, setOffer] = useState<StoredReviewOffer | null>(null);
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [jobNote, setJobNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const sync = () => {
      const next = readAnyStoredReviewOffer();
      setOffer(next);
      setJobNote(next?.jobNote ?? "");
      setPhotoUrl(next?.photoUrl ?? null);
      setStars(5);
      setError(null);
      setDone(false);
    };
    sync();
    window.addEventListener(REVIEW_OFFER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(REVIEW_OFFER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!offer) return null;

  if (done) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] z-40 px-3 md:bottom-6">
        <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-secondary/30 bg-card p-3 text-center text-sm font-semibold text-secondary shadow-lg">
          {t("contacts.reviewSaved")}
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] z-40 px-3 md:bottom-6">
      <div className="pointer-events-auto mx-auto max-w-lg space-y-2.5 rounded-2xl border border-primary/20 bg-card p-3 shadow-lg">
        <div>
          <p className="text-sm font-semibold text-ink">
            {t("tasks.reviewOfferTitle", { name: offer.name })}
          </p>
          <p className="text-xs text-muted">{t("tasks.reviewOfferHint")}</p>
          {offer.workLabel ? (
            <p className="mt-1 text-xs font-semibold text-ink">
              {offer.workLabel}
            </p>
          ) : null}
        </div>

        <div>
          <Label className="text-xs">{t("contacts.reviewStars")}</Label>
          <div className="mt-0.5">
            <StarsPicker value={stars} onChange={setStars} />
          </div>
        </div>

        <div>
          <Label className="text-xs">{t("tasks.reviewOfferJobNote")}</Label>
          <Textarea
            rows={2}
            className="mt-1"
            value={jobNote}
            onChange={(e) => setJobNote(e.target.value)}
            placeholder={t("tasks.reviewOfferJobNotePlaceholder")}
          />
        </div>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              setError(null);
              void data
                .uploadChatAttachment(file)
                .then((url) => {
                  if (!url) throw new Error(t("common.error"));
                  setPhotoUrl(url);
                })
                .catch((err: unknown) =>
                  setError(
                    err instanceof Error ? err.message : t("common.error"),
                  ),
                )
                .finally(() => setBusy(false));
            }}
          />
          {photoUrl ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt=""
                className="size-12 rounded-lg object-cover"
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
              size="xs"
              variant="ghost"
              className="w-full"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="size-3.5" />
              {busy ? t("common.loading") : t("tasks.reviewOfferAddPhoto")}
            </Button>
          )}
        </div>

        {error ? <p className="text-xs text-danger">{error}</p> : null}

        <div className="flex gap-2">
          <Button
            size="xs"
            className="flex-1"
            busy={busy}
            onClick={() => {
              setBusy(true);
              setError(null);
              void data
                .castEndorsement(offer.toProfileId, stars, jobNote, {
                  photoUrl,
                  workLabel: offer.workLabel ?? null,
                })
                .then(() => {
                  clearStoredReviewOffer(offer.taskId);
                  setDone(true);
                  window.setTimeout(() => setDone(false), 2200);
                })
                .catch((err: unknown) =>
                  setError(
                    err instanceof Error ? err.message : t("common.error"),
                  ),
                )
                .finally(() => setBusy(false));
            }}
          >
            {busy ? t("common.loading") : t("tasks.reviewOfferSubmit")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            disabled={busy}
            onClick={() => clearStoredReviewOffer(offer.taskId)}
          >
            {t("tasks.reviewOfferNo")}
          </Button>
        </div>
      </div>
    </div>
  );
}
