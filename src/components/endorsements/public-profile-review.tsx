"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StarsPicker } from "@/components/endorsements/stars";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { DataProvider } from "@/lib/data/data-provider";
import { useData } from "@/lib/data/use-app-data";
import { weekKey } from "@/lib/endorsements";
import { canCastEndorsement } from "@/lib/roles";
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
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [note, setNote] = useState("");
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

  if (!data.ready) return null;

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

  if (!canReview) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary-soft/60 p-4">
      <div>
        <h2 className="text-base font-bold text-ink">
          {t("contacts.reviewTitle", { name: toName })}
        </h2>
        <p className="mt-0.5 text-sm text-muted">{t("contacts.reviewHint")}</p>
      </div>
      {alreadyDone || ok ? (
        <p className="text-sm font-semibold text-secondary">
          {ok ?? t("contacts.reviewDone")}
        </p>
      ) : (
        <>
          <StarsPicker value={stars} onChange={setStars} />
          <div>
            <Label>{t("contacts.reviewNote")}</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("contacts.reviewNotePlaceholder")}
            />
          </div>
        </>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {!alreadyDone && !ok ? (
        <Button
          className="w-full"
          disabled={saving}
          onClick={() => {
            setSaving(true);
            setError(null);
            void data
              .castEndorsement(toProfileId, stars, note)
              .then(() => setOk(t("contacts.reviewSaved")))
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
      ) : null}
    </div>
  );
}
