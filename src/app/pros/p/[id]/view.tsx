"use client";

import { useState } from "react";
import Link from "next/link";
import { OriginalText, ServicesAccountGate } from "@/components/pros/parts";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { areaName, categoryName, jobsFor, reviewAverage } from "@/lib/pros/matching";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";

export function ProfileView({ id }: { id: string }) {
  const { state, actor, actorReady, t, report, rememberTranslation, toggleFavourite } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const pro = state.profiles.find((row) => row.id === id);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  if (!pro || pro.status === "suspended") return <p className="text-pf-16 text-pf-text-secondary">{t("noPros")}</p>;
  const team = Boolean(actor?.orgId && pro.orgId === actor.orgId);
  if (pro.visibility === "private" && !team) {
    return <p className="text-pf-16 text-pf-text-secondary">{t("privateProfile")}</p>;
  }
  const trades = pro.categoryIds.map((cat) => categoryName(state, cat, locale)).filter(Boolean);
  const rating = reviewAverage(state.reviews, pro.id);
  if (!actor) {
    return (
      <div className="space-y-4">
        <div className="select-none blur-[6px]" aria-hidden>
          <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{pro.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {trades.map((label) => (
              <span key={label} className="rounded-full bg-pf-peach-100 px-2 py-0.5 text-pf-12 font-medium text-pf-ink">{label}</span>
            ))}
          </div>
        </div>
        {actorReady ? <ServicesAccountGate next={pathname} /> : null}
      </div>
    );
  }
  const saved = Boolean(actor && (state.favourites[actor.id] ?? []).includes(pro.id));
  const jobs = jobsFor(state.jobs, pro.id);
  const reviews = state.reviews.filter((row) => row.profileId === pro.id);
  const checks = [
    pro.checks.email ? t("emailVerified") : null,
    pro.checks.phone ? t("phoneVerified") : null,
    pro.checks.identity ? t("identityChecked") : null,
    pro.checks.business ? t("businessChecked") : null,
    pro.checks.qualification ? t("qualificationChecked") : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{pro.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {trades.map((label) => (
            <span key={label} className="rounded-full bg-pf-peach-100 px-2 py-0.5 text-pf-12 font-medium text-pf-ink">{label}</span>
          ))}
          {pro.areaIds.map((area) => areaName(state, area, locale)).filter(Boolean).map((label) => (
            <span key={label} className="rounded-full bg-pf-yellow-300 px-2 py-0.5 text-pf-12 font-medium text-pf-ink">{label}</span>
          ))}
        </div>
      </div>
      <OriginalText
        text={pro.description}
        locale={pro.descriptionLocale}
        translations={pro.translations}
        onSave={(lang, text) => rememberTranslation("profile", pro.id, lang, text)}
      />
      <p className="text-pf-16 text-pf-ink">
        {rating == null ? t("noReviews") : rating.toFixed(1)}
      </p>
      {jobs.length > 0 ? (
        <p className="text-pf-14 text-pf-text-secondary">{jobs.length === 1 ? t("verifiedJob") : t("verifiedJobs", { count: jobs.length })}</p>
      ) : null}
      {checks.length > 0 ? (
        <ul className="space-y-1 text-pf-16 text-pf-ink">
          {checks.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
      {pro.photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {pro.photos.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src.slice(0, 32)} src={src} alt="" className="h-24 w-full rounded-[14px] object-cover" />
          ))}
        </div>
      ) : null}
      {actor ? (
        <button type="button" className="min-h-12 text-pf-14 font-medium text-pf-text-secondary" onClick={() => toggleFavourite(pro.id)}>
          {saved ? t("savedFavourite") : t("saveFavourite")}
        </button>
      ) : null}
      <p className="text-pf-14 text-pf-text-secondary">{t("contactHidden")}</p>
      <Link
        href={servicesPath(pathname, `/request?profile=${pro.id}&category=${pro.categoryIds[0] ?? ""}`)}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white active:bg-pf-orange-700"
      >
        {t("sendRequest")}
      </Link>
      {reviews.length === 0 ? <p className="text-pf-14 text-pf-text-secondary">{t("noReviews")}</p> : null}
      {reviews.map((review) => (
        <article key={review.id} className="rounded-[20px] border border-pf-line bg-pf-card p-3">
          <p className="text-pf-14 font-medium text-pf-ink">{review.stars}</p>
          <OriginalText
            text={review.comment}
            locale={review.originalLocale}
            translations={review.translations}
            onSave={(lang, text) => rememberTranslation("review", review.id, lang, text)}
          />
        </article>
      ))}
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          report("profile", pro.id, reason);
          setSent(true);
        }}
      >
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reason")} aria-label={t("reason")} />
        <Button type="submit" variant="ghost" reflectGlobalBusy={false}>
          {sent ? t("reported") : t("report")}
        </Button>
      </form>
    </div>
  );
}
