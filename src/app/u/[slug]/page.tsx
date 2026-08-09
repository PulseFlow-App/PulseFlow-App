"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PulseMark } from "@/components/brand/pulse-mark";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarsDisplay } from "@/components/endorsements/stars";
import { getPublicProfileBySlug } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/supabase/client";
import {
  orgsForProfile,
  summarizeRatings,
  weekLabel,
} from "@/lib/endorsements";
import { ROLE_LABELS } from "@/lib/roles";
import { brand } from "@/lib/design-tokens";

type PublicData = NonNullable<ReturnType<typeof getPublicProfileBySlug>>;

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<PublicData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isDemoMode()) {
      setLoaded(true);
      return;
    }
    setData(getPublicProfileBySlug(slug));
    setLoaded(true);
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
        Loading profile…
      </div>
    );
  }

  if (!data || !rating) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-sand px-4 font-sans">
        <Card className="w-full max-w-md space-y-3 p-6 text-center">
          <PulseMark className="mx-auto size-12" />
          <h1 className="text-xl font-bold text-ink">Profile not found</h1>
          <p className="text-sm text-muted">
            This share link may be invalid or private.
          </p>
          <Link href="/login">
            <Button className="w-full">Go to PulseFlow</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const recent = [...data.endorsements]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 8);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-sand px-4 py-8 font-sans">
      <div className="mb-6 flex items-center gap-3">
        <PulseMark className="size-10" />
        <div>
          <p className="text-lg font-bold text-ink">{brand.name}</p>
          <p className="text-xs text-muted">Public reputation profile</p>
        </div>
      </div>

      <Card className="space-y-4 p-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {data.profile.full_name}
          </h1>
          <p className="text-sm text-muted">
            {ROLE_LABELS[data.profile.role]}
            {data.profile.job_title ? ` · ${data.profile.job_title}` : ""}
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
          <p className="text-sm text-white/85">Reputation</p>
          <p className="mt-1 text-4xl font-bold">
            {rating.voteCount > 0 ? rating.average.toFixed(1) : "-"}
          </p>
          <div className="mt-2">
            <StarsDisplay value={rating.average} size="lg" />
          </div>
          <p className="mt-3 text-sm text-white/90">
            {rating.totalStars} stars collected · {rating.voteCount} weekly
            endorsements
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#F7F5F1] p-3">
            <p className="text-xs font-semibold uppercase text-muted">
              Tasks done
            </p>
            <p className="mt-1 text-2xl font-bold text-ink">{data.tasksDone}</p>
          </div>
          <div className="rounded-2xl bg-[#F7F5F1] p-3">
            <p className="text-xs font-semibold uppercase text-muted">
              Open tasks
            </p>
            <p className="mt-1 text-2xl font-bold text-ink">{data.tasksOpen}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Companies
          </p>
          {companies.length === 0 ? (
            <p className="mt-1 text-sm text-muted">No company registrations yet.</p>
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
                    className="flex items-center justify-between rounded-2xl bg-[#F7F5F1] px-3 py-2.5 text-sm"
                  >
                    <span className="font-semibold text-ink">{org.name}</span>
                    <StarsDisplay value={orgRating.average} size="sm" showValue />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Recent endorsements
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
                    <span className="text-[11px] text-muted">
                      {weekLabel(e.week_key)}
                    </span>
                  </div>
                  {e.note ? (
                    <p className="mt-1 text-sm text-ink">{e.note}</p>
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
  );
}
