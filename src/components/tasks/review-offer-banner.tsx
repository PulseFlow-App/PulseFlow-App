"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";

const STORAGE_PREFIX = "pf-review-offer:";
const DRAFT_NOTE_KEY = "pf-review-draft-note";
export const REVIEW_OFFER_EVENT = "pf-review-offer";

export type StoredReviewOffer = {
  taskId: string;
  name: string;
  href: string;
  /** Task title or job type shown as context. */
  workLabel?: string;
  /** Draft note about this job/task (optional). */
  jobNote?: string;
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
        workLabel?: string;
        jobNote?: string;
      };
      if (!parsed?.href || !parsed?.name) continue;
      return {
        taskId: key.slice(STORAGE_PREFIX.length),
        name: parsed.name,
        href: parsed.href,
        workLabel: parsed.workLabel?.trim() || undefined,
        jobNote: parsed.jobNote ?? "",
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
    workLabel?: string | null;
    jobNote?: string | null;
  },
) {
  try {
    sessionStorage.setItem(
      reviewOfferStorageKey(taskId),
      JSON.stringify({
        name: offer.name,
        href: offer.href,
        workLabel: offer.workLabel?.trim() || undefined,
        jobNote: offer.jobNote ?? "",
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

/** Pass note from the banner into the profile review form. */
export function writeReviewDraftNote(note: string) {
  try {
    const trimmed = note.trim();
    if (trimmed) sessionStorage.setItem(DRAFT_NOTE_KEY, trimmed);
    else sessionStorage.removeItem(DRAFT_NOTE_KEY);
  } catch {
    /* ignore */
  }
}

export function takeReviewDraftNote(): string {
  if (typeof window === "undefined") return "";
  try {
    const note = sessionStorage.getItem(DRAFT_NOTE_KEY) ?? "";
    sessionStorage.removeItem(DRAFT_NOTE_KEY);
    return note;
  } catch {
    return "";
  }
}

/** Survives task rows disappearing after confirm-done. */
export function ReviewOfferBanner() {
  const { t } = useI18n();
  const router = useRouter();
  const [offer, setOffer] = useState<StoredReviewOffer | null>(null);
  const [jobNote, setJobNote] = useState("");

  useEffect(() => {
    const sync = () => {
      const next = readAnyStoredReviewOffer();
      setOffer(next);
      setJobNote(next?.jobNote ?? "");
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

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] z-40 px-3 md:bottom-6">
      <div className="pointer-events-auto mx-auto max-w-lg space-y-2 rounded-2xl border border-primary/20 bg-card p-3 shadow-lg">
        <p className="text-sm font-semibold text-ink">
          {t("tasks.reviewOfferTitle", { name: offer.name })}
        </p>
        <p className="text-xs text-muted">{t("tasks.reviewOfferHint")}</p>
        {offer.workLabel ? (
          <p className="text-xs font-semibold text-ink">{offer.workLabel}</p>
        ) : null}
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
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              const href = offer.href;
              writeReviewDraftNote(jobNote);
              clearStoredReviewOffer(offer.taskId);
              router.push(href);
            }}
          >
            <Star className="size-4" />
            {t("tasks.reviewOfferYes")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearStoredReviewOffer(offer.taskId)}
          >
            {t("tasks.reviewOfferNo")}
          </Button>
        </div>
      </div>
    </div>
  );
}
