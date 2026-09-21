"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { StarsPicker } from "@/components/endorsements/stars";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { DataProvider } from "@/lib/data/data-provider";
import { useData } from "@/lib/data/use-app-data";
import { weekKey } from "@/lib/endorsements";
import { canCastEndorsement } from "@/lib/roles";
import { takeReviewDraft } from "@/components/tasks/review-offer-banner";
import { useI18n } from "@/lib/i18n/provider";

/** Inline weekly review form on a public profile (`?review=1`). */
export function PublicProfileReviewForm(props: {
  toProfileId: string;
  toName: string;
}) {
  return (
    <DataProvider>
      <PublicProfileReviewFormInner {...props} />
    </DataProvider>
  );
}

function PublicProfileReviewFormInner({
  toProfileId,
  toName,
}: {
  toProfileId: string;
  toName: string;
}) {
  const data = useData();
  const { t } = useI18n();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const draft = useMemo(() => takeReviewDraft(), []);
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [note, setNote] = useState(draft.note);
  const [photoUrl, setPhotoUrl] = useState<string | null>(draft.photoUrl);
  const [workLabel] = useState<string | null>(draft.workLabel);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const currentWeek = weekKey();

  const canReview =
    data.ready &&
    data.profile &&
    data.profile.id !== toProfileId &&
    canCastEndorsement(data.profile.role, data.orgKind);

  const alreadyDone = useMemo(() => {
    if (!data.profile) return false;
    return data.endorsements.some(
      (e) =>
        e.org_id === data.profile!.org_id &&
        e.from_profile_id === data.profile!.id &&
        e.to_profile_id === toProfileId &&
        e.week_key === currentWeek,
    );
  }, [data.endorsements, data.profile, toProfileId, currentWeek]);

  if (!data.ready) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary-soft/60 p-4 text-sm text-muted">
        {t("common.loading")}
      </div>
    );
  }

  if (!data.profile) {
    return (
      <div className="rounded-2xl bg-[#F7F5F1] px-3 py-3 text-sm">
        <p className="font-semibold text-ink">{t("publicProfile.reviewSignIn")}</p>
        <Link href="/login" className="mt-2 inline-block">
          <Button size="sm">{t("publicProfile.goApp")}</Button>
        </Link>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="rounded-2xl bg-[#F7F5F1] px-3 py-3 text-sm text-muted">
        {t("publicProfile.reviewNotAllowed")}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary-soft/60 p-4">
      <div>
        <h2 className="text-base font-bold text-ink">
          {t("contacts.reviewTitle", { name: toName })}
        </h2>
        <p className="mt-0.5 text-sm text-muted">{t("contacts.reviewHint")}</p>
        {workLabel ? (
          <p className="mt-1 text-xs font-semibold text-ink">{workLabel}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted">{t("tasks.reviewOfferOptional")}</p>
      </div>
      {alreadyDone || ok ? (
        <p className="text-sm font-semibold text-secondary">
          {ok ?? t("contacts.reviewDone")}
        </p>
      ) : (
        <>
          <div>
            <Label>{t("contacts.reviewStars")}</Label>
            <div className="mt-1">
              <StarsPicker value={stars} onChange={setStars} />
            </div>
          </div>
          <div>
            <Label>{t("contacts.reviewNote")}</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
                setSaving(true);
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
                  .finally(() => setSaving(false));
              }}
            />
            {photoUrl ? (
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt=""
                  className="size-16 rounded-lg object-cover"
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
                disabled={saving}
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="size-4" />
                {t("tasks.reviewOfferAddPhoto")}
              </Button>
            )}
          </div>
        </>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {!alreadyDone && !ok ? (
        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            busy={saving}
            onClick={() => {
              setSaving(true);
              setError(null);
              void data
                .castEndorsement(toProfileId, stars, note, {
                  photoUrl,
                  workLabel,
                })
                .then(() => {
                  setOk(t("contacts.reviewSaved"));
                  window.setTimeout(() => router.back(), 600);
                })
                .catch((e: unknown) =>
                  setError(e instanceof Error ? e.message : t("common.error")),
                )
                .finally(() => setSaving(false));
            }}
          >
            {saving
              ? t("common.loading")
              : t("contacts.reviewSubmit", { stars })}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={saving}
            onClick={() => router.back()}
          >
            {t("tasks.reviewOfferNo")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
