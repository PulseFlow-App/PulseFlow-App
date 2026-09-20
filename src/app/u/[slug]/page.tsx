"use client";

import { use, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { PulseMark } from "@/components/brand/pulse-mark";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarsDisplay } from "@/components/endorsements/stars";
import { PublicProfileReviewForm } from "@/components/endorsements/public-profile-review";
import { getPublicProfileBySlug } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/supabase/client";
import {
  orgsForProfile,
  summarizeRatings,
  weekLabel,
} from "@/lib/endorsements";
import { formatTalentPlace } from "@/lib/talent";
import { brand } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/provider";
import { labelRole } from "@/lib/i18n/labels";
import type {
  Endorsement,
  OrgMembership,
  Organization,
  Profile,
} from "@/lib/types";

type PublicData = {
  profile: Profile;
  endorsements: Endorsement[];
  memberships: OrgMembership[];
  orgs: Organization[];
  tasksDone: number;
  tasksOpen: number;
};

function PublicProfileBack({ label }: { label: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const fromApp =
          typeof document !== "undefined" &&
          Boolean(document.referrer) &&
          document.referrer.startsWith(window.location.origin);
        if (fromApp) {
          router.back();
          return;
        }
        router.push("/settings");
      }}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  );
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-sand font-sans text-sm text-muted">
          Loading…
        </div>
      }
    >
      <PublicProfilePageInner params={params} />
    </Suspense>
  );
}

function PublicProfilePageInner({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const showReview = searchParams.get("review") === "1";
  const [data, setData] = useState<PublicData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isDemoMode()) {
          const demo = getPublicProfileBySlug(slug);
          if (!cancelled) setData(demo);
          return;
        }
        const res = await fetch(
          `/api/public/profile/${encodeURIComponent(slug)}`,
        );
        if (!res.ok) {
          if (!cancelled) setData(null);
          return;
        }
        const payload = (await res.json()) as PublicData;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const rating = useMemo(() => {
    if (!data) return null;
    return summarizeRatings(data.endorsements, data.profile.id);
  }, [data]);

  const companies = useMemo(() => {
    if (!data) return [];
    return orgsForProfile(data.profile.id, data.memberships, data.orgs);
  }, [data]);

  if (!loaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-sand font-sans text-sm text-muted">
        {t("publicProfile.loading")}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-sand px-4 font-sans">
        <Card className="w-full max-w-md space-y-3 p-6 text-center">
          <PulseMark className="mx-auto size-12" />
          <h1 className="text-xl font-bold text-ink">
            {t("publicProfile.notFound")}
          </h1>
          <p className="text-sm text-muted">{t("publicProfile.notFoundHint")}</p>
          <Link href="/settings">
            <Button className="w-full" variant="secondary">
              {t("publicProfile.backSettings")}
            </Button>
          </Link>
          <Link href="/login">
            <Button className="w-full">{t("publicProfile.goApp")}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const ratingSummary = rating ?? summarizeRatings(data.endorsements, data.profile.id);

  const recent = [...data.endorsements]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 8);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-sand font-sans">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
        <div className="mx-auto w-full max-w-lg px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <PublicProfileBack label={t("publicProfile.back")} />
          <div className="mb-6 flex items-center gap-3">
            <PulseMark className="size-10 shrink-0" />
            <div className="min-w-0">
              <p className="text-lg font-bold text-ink">{brand.name}</p>
              <p className="text-xs text-muted">{t("publicProfile.subtitle")}</p>
            </div>
          </div>

          <Card className="space-y-4 overflow-hidden p-5">
            <div>
              <h1 className="text-2xl font-bold text-ink">
                {data.profile.full_name}
              </h1>
              <p className="text-sm text-muted">
                {labelRole(t, data.profile.role)}
                {data.profile.job_title ? ` · ${data.profile.job_title}` : ""}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {t("publicProfile.contactsPrivate")}
              </p>
              {data.profile.job_search_visible
                ? (() => {
                    const place = formatTalentPlace(data.profile);
                    return place ? (
                      <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-secondary-dark">
                        <MapPin className="size-3.5 shrink-0" />
                        {place}
                      </p>
                    ) : null;
                  })()
                : null}
            </div>

            <div className="min-w-0 overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-primary to-primary-dark p-4 text-white sm:p-5">
              <p className="text-sm text-white/85">
                {t("publicProfile.reputation")}
              </p>
              <p className="mt-1 text-4xl font-bold tabular-nums">
                {ratingSummary.voteCount > 0
                  ? ratingSummary.average.toFixed(1)
                  : "-"}
              </p>
              <div className="mt-2 max-w-full">
                <StarsDisplay
                  value={ratingSummary.average}
                  size="md"
                  tone="onDark"
                />
              </div>
              <p className="mt-3 text-sm leading-snug text-white/90">
                {t("publicProfile.starsLine", {
                  stars: ratingSummary.totalStars,
                  votes: ratingSummary.voteCount,
                })}
              </p>
            </div>

            {showReview ? (
              <PublicProfileReviewForm
                toProfileId={data.profile.id}
                toName={data.profile.full_name}
              />
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#F7F5F1] p-3">
                <p className="text-xs font-semibold uppercase text-muted">
                  {t("publicProfile.tasksDone")}
                </p>
                <p className="mt-1 text-2xl font-bold text-ink">
                  {data.tasksDone}
                </p>
              </div>
              <div className="rounded-2xl bg-[#F7F5F1] p-3">
                <p className="text-xs font-semibold uppercase text-muted">
                  {t("publicProfile.tasksOpen")}
                </p>
                <p className="mt-1 text-2xl font-bold text-ink">
                  {data.tasksOpen}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Companies
              </p>
              {companies.length === 0 ? (
                <p className="mt-1 text-sm text-muted">
                  No company registrations yet.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {companies.map((org) => {
                    const orgRating = summarizeRatings(
                      data.endorsements.filter((e) => e.org_id === org.id),
                      data.profile.id,
                    );
                    return (
                      <li
                        key={org.id}
                        className="flex min-w-0 items-center justify-between gap-2 rounded-2xl bg-[#F7F5F1] px-3 py-2.5 text-sm"
                      >
                        <span className="min-w-0 truncate font-semibold text-ink">
                          {org.name}
                        </span>
                        <StarsDisplay
                          value={orgRating.average}
                          size="sm"
                          showValue
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("talent.reviewsSection")}
              </p>
              {recent.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No votes yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {recent.map((e) => (
                    <li
                      key={e.id}
                      className="rounded-2xl border border-black/5 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <StarsDisplay value={e.stars} size="sm" />
                        <span className="shrink-0 text-[11px] text-muted">
                          {weekLabel(e.week_key, locale)}
                        </span>
                      </div>
                      {e.work_label ? (
                        <p className="mt-1 text-xs font-semibold text-muted">
                          {e.work_label}
                        </p>
                      ) : null}
                      {e.note ? (
                        <p className="mt-1 text-sm text-ink">{e.note}</p>
                      ) : null}
                      {e.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.photo_url}
                          alt=""
                          className="mt-2 max-h-48 w-full rounded-xl object-cover"
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <p className="mt-6 text-center text-xs text-muted">
            Built with {brand.name} - {brand.tagline}
          </p>
        </div>
      </div>
    </div>
  );
}
