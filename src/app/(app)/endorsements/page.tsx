"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import { StarsDisplay, StarsPicker } from "@/components/endorsements/stars";
import { useData } from "@/lib/data/use-app-data";
import {
  summarizeRatings,
  weekKey,
  weekLabel,
} from "@/lib/endorsements";
import { ROLE_LABELS } from "@/lib/roles";

export default function EndorsementsPage() {
  const data = useData();
  const currentWeek = weekKey();
  const isOwner = data.profile?.role === "owner";

  const teammates = useMemo(
    () =>
      data.profiles.filter(
        (p) => p.role !== "owner" && p.id !== data.profile?.id,
      ),
    [data.profiles, data.profile?.id],
  );

  const myRating = useMemo(() => {
    if (!data.profile) return null;
    return summarizeRatings(data.endorsements, data.profile.id, currentWeek);
  }, [data.endorsements, data.profile, currentWeek]);

  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [note, setNote] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!data.ready || !data.profile) return <LoadingState />;

  const alreadyVotedIds = new Set(
    data.endorsements
      .filter(
        (e) =>
          e.org_id === data.profile!.org_id &&
          e.from_profile_id === data.profile!.id &&
          e.week_key === currentWeek,
      )
      .map((e) => e.to_profile_id),
  );

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/u/${data.profile.share_slug}`
      : `/u/${data.profile.share_slug}`;

  return (
    <div className="space-y-4 animate-rise font-sans">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Endorsements</h1>
          <p className="text-sm text-muted">
            {weekLabel(currentWeek)} · weekly reputation
          </p>
        </div>
        <Link href="/leaderboard">
          <Button size="sm" variant="ghost">
            <Trophy className="size-4" /> Board
          </Button>
        </Link>
      </div>

      {isOwner ? (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-bold text-ink">Vote this week</h2>
            <p className="mt-1 text-sm text-muted">
              Rate each teammate once per week. Stars build their public
              reputation for future companies.
            </p>
          </div>

          <div className="space-y-2">
            {teammates.map((person) => {
              const rating = summarizeRatings(
                data.endorsements.filter((e) => e.org_id === data.profile!.org_id),
                person.id,
                currentWeek,
              );
              const done = alreadyVotedIds.has(person.id);
              const active = selectedId === person.id;
              return (
                <button
                  key={person.id}
                  type="button"
                  disabled={done}
                  onClick={() => {
                    setSelectedId(person.id);
                    setOk(null);
                    setError(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${
                    active
                      ? "bg-primary-soft"
                      : done
                        ? "bg-[#F7F5F1] opacity-70"
                        : "bg-[#F7F5F1] hover:bg-primary-soft/60"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-ink">{person.full_name}</p>
                    <p className="text-xs text-muted">
                      {ROLE_LABELS[person.role]}
                      {person.job_title ? ` · ${person.job_title}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <StarsDisplay value={rating.average} size="sm" />
                    <p className="mt-0.5 text-[11px] text-muted">
                      {done ? "Voted this week" : `${rating.voteCount} votes`}
                    </p>
                  </div>
                </button>
              );
            })}
            {teammates.length === 0 ? (
              <p className="text-sm text-muted">
                Invite managers or staff first, then endorse them weekly.
              </p>
            ) : null}
          </div>

          {selectedId && !alreadyVotedIds.has(selectedId) ? (
            <div className="space-y-3 border-t border-black/5 pt-4">
              <p className="text-sm font-semibold text-ink">
                Stars for{" "}
                {teammates.find((t) => t.id === selectedId)?.full_name}
              </p>
              <StarsPicker value={stars} onChange={setStars} />
              <div>
                <Label>Note (optional)</Label>
                <Textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What stood out this week?"
                />
              </div>
              {error ? (
                <p className="text-sm font-semibold text-danger">{error}</p>
              ) : null}
              {ok ? (
                <p className="text-sm font-semibold text-secondary">{ok}</p>
              ) : null}
              <Button
                className="w-full"
                onClick={() => {
                  setError(null);
                  void data
                    .castEndorsement(selectedId, stars, note)
                    .then(() => {
                      setOk("Endorsement saved for this week.");
                      setNote("");
                      setSelectedId("");
                    })
                    .catch((e: unknown) =>
                      setError(
                        e instanceof Error ? e.message : "Could not save.",
                      ),
                    );
                }}
              >
                Submit {stars}-star endorsement
              </Button>
            </div>
          ) : null}
        </Card>
      ) : (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-bold text-ink">Your reputation</h2>
            <p className="mt-1 text-sm text-muted">
              Owners vote weekly. Share your profile when applying to other
              villa companies.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
            <p className="text-sm text-white/85">Average rating</p>
            <p className="mt-1 text-4xl font-bold">
              {myRating && myRating.voteCount > 0
                ? myRating.average.toFixed(1)
                : "-"}
            </p>
            <div className="mt-2">
              <StarsDisplay
                value={myRating?.average ?? 0}
                size="lg"
              />
            </div>
            <p className="mt-3 text-sm text-white/90">
              {myRating?.totalStars ?? 0} stars from {myRating?.voteCount ?? 0}{" "}
              weekly votes
            </p>
          </div>

          <div className="rounded-2xl bg-[#F7F5F1] px-3 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Shareable profile
            </p>
            <p className="mt-1 break-all font-semibold text-ink">{shareUrl}</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                <Copy className="size-4" />
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Link href={`/u/${data.profile.share_slug}`} className="flex-1">
                <Button size="sm" variant="ghost" className="w-full">
                  Preview
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
