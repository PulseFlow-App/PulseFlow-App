"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LoadingState, EmptyState } from "@/components/ui/empty-state";
import { StarsDisplay } from "@/components/endorsements/stars";
import { useData } from "@/lib/data/use-app-data";
import {
  leaderboardForOrg,
  orgsForProfile,
  summarizeRatings,
} from "@/lib/endorsements";
import { ROLE_LABELS, canUseTeamReputation } from "@/lib/roles";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const data = useData();
  const isOwner = data.profile?.role === "owner";

  const myCompanies = useMemo(() => {
    if (!data.profile) return [];
    return orgsForProfile(data.profile.id, data.memberships, data.orgs);
  }, [data.profile, data.memberships, data.orgs]);

  const [orgTab, setOrgTab] = useState<string>("");

  const activeOrgId = useMemo(() => {
    if (isOwner) return data.profile?.org_id ?? "";
    if (orgTab) return orgTab;
    return myCompanies[0]?.id ?? data.profile?.org_id ?? "";
  }, [isOwner, data.profile?.org_id, orgTab, myCompanies]);

  const memberIds = useMemo(() => {
    return new Set(
      data.memberships
        .filter((m) => m.org_id === activeOrgId && m.role !== "owner")
        .map((m) => m.profile_id),
    );
  }, [data.memberships, activeOrgId]);

  const rows = useMemo(() => {
    if (!activeOrgId) return [];
    return leaderboardForOrg(
      data.endorsements,
      data.allProfiles,
      activeOrgId,
      memberIds.size ? memberIds : undefined,
    );
  }, [activeOrgId, data.endorsements, data.allProfiles, memberIds]);

  if (!data.ready || !data.profile) return <LoadingState />;

  if (!canUseTeamReputation(data.orgKind)) {
    return (
      <EmptyState
        title="Leaderboards are for companies"
        description="Personal workspaces are solo - team rankings appear when you work with a company."
      />
    );
  }

  const activeOrgName =
    data.orgs.find((o) => o.id === activeOrgId)?.name ?? data.orgName;

  const selectedTab = orgTab || myCompanies[0]?.id;

  return (
    <div className="space-y-4 animate-rise font-sans">
      <div>
        <Link href="/endorsements" className="text-sm font-semibold text-muted">
          ← Endorsements
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">Leaderboard</h1>
        <p className="text-sm text-muted">
          {isOwner
            ? "Your company ranking from weekly owner votes"
            : "Rankings by company - switch tabs if you work with more than one"}
        </p>
      </div>

      {!isOwner && myCompanies.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {myCompanies.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => setOrgTab(org.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                selectedTab === org.id
                  ? "bg-gradient-to-r from-primary to-primary-dark text-white"
                  : "bg-white text-muted soft-shadow",
              )}
            >
              {org.name}
            </button>
          ))}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-b border-black/5 px-4 py-3">
          <p className="text-sm font-bold text-ink">{activeOrgName}</p>
          <p className="text-xs text-muted">Sorted by average stars</p>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">
            No team endorsements yet for this company.
          </p>
        ) : (
          <ol className="divide-y divide-black/5">
            {rows.map((row, index) => {
              const mine = row.profile.id === data.profile?.id;
              return (
                <li
                  key={row.profile.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    mine && "bg-primary-soft/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full text-sm font-bold",
                      index === 0
                        ? "bg-primary text-white"
                        : "bg-[#F7F5F1] text-muted",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/u/${row.profile.share_slug}`}
                      className="truncate font-semibold text-ink"
                    >
                      {row.profile.full_name}
                      {mine ? " (you)" : ""}
                    </Link>
                    <p className="text-xs text-muted">
                      {ROLE_LABELS[row.profile.role]}
                      {row.profile.job_title
                        ? ` · ${row.profile.job_title}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <StarsDisplay
                      value={row.rating.average}
                      size="sm"
                      showValue
                    />
                    <p className="text-[11px] text-muted">
                      {row.rating.totalStars}★ · {row.rating.voteCount} votes
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      {!isOwner && data.profile ? (
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Your overall PulseFlow rating
          </p>
          <div className="mt-2 flex items-center justify-between">
            <StarsDisplay
              value={
                summarizeRatings(data.endorsements, data.profile.id).average
              }
              showValue
            />
            <Link
              href={`/u/${data.profile.share_slug}`}
              className="text-sm font-semibold text-primary"
            >
              Public profile
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
