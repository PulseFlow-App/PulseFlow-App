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
  if (!pro || pro.status === "suspended") return <p className="text-sm text-muted">{t("noPros")}</p>;
  const team = Boolean(actor?.orgId && pro.orgId === actor.orgId);
  if (pro.visibility === "private" && !team) {
    return <p className="text-sm text-muted">{t("privateProfile")}</p>;
  }
  const trade = pro.categoryIds.map((cat) => categoryName(state, cat, locale)).filter(Boolean).join(" · ");
  const rating = reviewAverage(state.reviews, pro.id);
  if (actorReady && !actor) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{pro.name}</h1>
          <p className="text-sm text-muted">{trade}</p>
          <p className="mt-1 text-sm text-ink/80">{rating == null ? t("noReviews") : rating.toFixed(1)}</p>
        </div>
        <ServicesAccountGate next={pathname} />
      </div>
    );
  }
  const saved = Boolean(actor && (state.favourites[actor.id] ?? []).includes(pro.id));
  const jobs = jobsFor(state.jobs, pro.id);
  const reviews = state.reviews.filter((row) => row.profileId === pro.id);
  const trades = [...new Set(jobs.map((job) => categoryName(state, job.categoryId, locale)).filter(Boolean))];
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
        <h1 className="font-display text-2xl font-semibold text-ink">{pro.name}</h1>
        <p className="text-sm text-muted">
          {pro.categoryIds.map((cat) => categoryName(state, cat, locale)).filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1 text-sm text-ink/80">
          {pro.areaIds.map((area) => areaName(state, area, locale)).filter(Boolean).join(" · ")}
        </p>
      </div>
      <OriginalText
        text={pro.description}
        locale={pro.descriptionLocale}
        translations={pro.translations}
        onSave={(lang, text) => rememberTranslation("profile", pro.id, lang, text)}
      />
      <p className="text-sm text-ink">
        {rating == null ? t("noReviews") : rating.toFixed(1)}
        {jobs.length > 0 ? ` · ${jobs.length === 1 ? t("verifiedJob") : t("verifiedJobs", { count: jobs.length })}` : ""}
      </p>
      {trades.length > 0 ? <p className="text-sm text-muted">{trades.join(" · ")}</p> : null}
      {checks.length > 0 ? (
        <ul className="space-y-1 text-sm text-ink">
          {checks.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      ) : null}
      {pro.photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {pro.photos.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src.slice(0, 32)} src={src} alt="" className="h-24 w-full rounded-xl object-cover" />
          ))}
        </div>
      ) : null}
      {actor ? (
        <button type="button" className="min-h-12 text-sm font-semibold text-primary" onClick={() => toggleFavourite(pro.id)}>
          {saved ? t("savedFavourite") : t("saveFavourite")}
        </button>
      ) : null}
      <p className="text-sm text-muted">{t("contactHidden")}</p>
      <Link
        href={servicesPath(pathname, `/request?profile=${pro.id}&category=${pro.categoryIds[0] ?? ""}`)}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-pill)] bg-primary px-4 text-sm font-semibold text-white"
      >
        {t("sendRequest")}
      </Link>
      {reviews.length === 0 ? <p className="text-sm text-muted">{t("noReviews")}</p> : null}
      {reviews.map((review) => (
        <article key={review.id} className="rounded-2xl border border-[var(--color-border)] bg-card p-3">
          <p className="text-sm font-semibold text-ink">{review.stars}</p>
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
