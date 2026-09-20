"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

const STORAGE_PREFIX = "pf-review-offer:";
export const REVIEW_OFFER_EVENT = "pf-review-offer";

export type StoredReviewOffer = {
  taskId: string;
  name: string;
  href: string;
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
      const parsed = JSON.parse(raw) as { name?: string; href?: string };
      if (!parsed?.href || !parsed?.name) continue;
      return {
        taskId: key.slice(STORAGE_PREFIX.length),
        name: parsed.name,
        href: parsed.href,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredReviewOffer(
  taskId: string,
  offer: { name: string; href: string },
) {
  try {
    sessionStorage.setItem(
      reviewOfferStorageKey(taskId),
      JSON.stringify(offer),
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

/** Survives task rows disappearing after confirm-done. */
export function ReviewOfferBanner() {
  const { t } = useI18n();
  const router = useRouter();
  const [offer, setOffer] = useState<StoredReviewOffer | null>(null);

  useEffect(() => {
    const sync = () => setOffer(readAnyStoredReviewOffer());
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
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              const href = offer.href;
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
