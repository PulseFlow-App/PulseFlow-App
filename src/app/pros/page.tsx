"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GuestAuthStrip } from "@/components/pros/guest-auth-strip";
import { HomeScreen } from "@/components/pros/home-screen";
import { ProCard } from "@/components/pros/parts";
import { statusKey } from "@/lib/pros/i18n";
import {
  isServicesWorker,
  readMyListingId,
  serviceInviteCode,
  serviceInviteUrl,
} from "@/lib/pros/join";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";

export default function ProsHomePage() {
  const { state, actor, t } = usePros();
  const pathname = usePathname();
  const to = (path: string) => servicesPath(pathname, path);
  const [worker, setWorker] = useState(false);
  const [listingId, setListingId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = readMyListingId();
    setListingId(id);
    setWorker(Boolean(actor) && (isServicesWorker() || Boolean(id)));
    if (typeof window !== "undefined") {
      serviceInviteCode();
      setInviteLink(serviceInviteUrl(window.location.origin));
    }
  }, [actor]);

  const listing = listingId
    ? state.profiles.find((row) => row.id === listingId) ?? null
    : null;
  const inboxPending = useMemo(() => {
    if (!listingId) return [];
    return state.offers.filter(
      (offer) => offer.profileId === listingId && offer.status === "pending",
    );
  }, [listingId, state.offers]);
  const nextJob = useMemo(() => {
    if (!listingId) return null;
    const statuses = new Set(["chosen", "scheduled", "in_progress", "awaiting_approval"]);
    return (
      state.requests.find(
        (row) => row.chosenProfileId === listingId && statuses.has(row.status),
      ) ?? null
    );
  }, [listingId, state.requests]);
  const profileGaps =
    listing &&
    (!listing.photoUrl || !listing.categoryIds.length || !listing.areaIds.length);

  const active = actor
    ? state.requests.filter(
        (row) => row.createdBy === actor.id && row.status !== "completed" && row.status !== "cancelled",
      )
    : [];
  const saved = (actor ? state.favourites[actor.id] ?? [] : [])
    .map((id) => state.profiles.find((pro) => pro.id === id))
    .filter((pro): pro is NonNullable<typeof pro> => Boolean(pro && pro.status === "active"));
  const recentIds: string[] = [];
  if (actor) {
    for (const row of state.requests) {
      if (row.createdBy !== actor.id || !row.chosenProfileId) continue;
      if (!recentIds.includes(row.chosenProfileId)) recentIds.push(row.chosenProfileId);
    }
  }
  const recent = recentIds
    .map((id) => state.profiles.find((pro) => pro.id === id))
    .filter((pro): pro is NonNullable<typeof pro> => Boolean(pro && pro.status === "active"))
    .slice(0, 4);

  if (worker && listing) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="type-title text-ink">{t("workerHome")}</h1>
          <p className="mt-1 text-sm text-muted">{listing.name}</p>
        </div>

        <section className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-card p-4">
          <h2 className="text-sm font-semibold text-ink">{t("listingStatus")}</h2>
          <p className="text-sm text-muted">
            {listing.status === "suspended"
              ? t("suspend")
              : listing.visibility === "public"
                ? t("listingOpen")
                : t("listingHidden")}
          </p>
          {profileGaps ? <p className="text-sm text-muted">{t("profileChecklist")}</p> : null}
          <Link href={to("/settings")} className="inline-flex text-sm font-semibold text-primary">
            {t("settings")}
          </Link>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">{t("inbox")}</h2>
            <Link href={to("/inbox")} className="text-xs font-semibold text-primary">
              {t("inbox")}
            </Link>
          </div>
          {inboxPending.length === 0 ? <p className="text-sm text-muted">{t("noInbox")}</p> : null}
          {inboxPending.slice(0, 3).map((offer) => {
            const request = state.requests.find((row) => row.id === offer.requestId);
            return (
              <Link
                key={offer.id}
                href={to(`/reply/${offer.token}`)}
                className="block rounded-2xl border border-[var(--color-border)] bg-card px-3 py-3"
              >
                <p className="text-sm font-semibold text-ink">{request?.title ?? t("replyNow")}</p>
                <p className="text-xs text-muted">{t("replyNow")}</p>
              </Link>
            );
          })}
        </section>

        <section className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-card p-4">
          <h2 className="text-sm font-semibold text-ink">{t("nextJob")}</h2>
          {nextJob ? (
            <Link href={to(`/requests/${nextJob.id}`)} className="block">
              <p className="text-sm font-semibold text-ink">{nextJob.title}</p>
              <p className="text-xs text-muted">{t(statusKey(nextJob.status))}</p>
            </Link>
          ) : (
            <p className="text-sm text-muted">{t("noInbox")}</p>
          )}
        </section>

        <section className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-card p-4">
          <h2 className="text-sm font-semibold text-ink">{t("shareInvite")}</h2>
          <p className="text-sm text-muted">{t("inviteHint")}</p>
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full"
            onClick={() => {
              const link = serviceInviteUrl(window.location.origin, { as: "pro" });
              setInviteLink(link);
              void navigator.clipboard.writeText(link).then(() => setCopied(true));
            }}
          >
            {copied ? t("copied") : t("copyInvite")}
          </Button>
          {inviteLink ? <p className="break-all text-xs text-muted">{inviteLink}</p> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HomeScreen />

      {actor ? (
        <section className="animate-rise-delay space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">
              {t("openRequests")}
            </h2>
            <Link href={to("/request")} className="text-xs font-semibold text-primary">
              {t("newRequestCta")}
            </Link>
          </div>
          {active.length === 0 ? (
            <p className="text-sm text-muted">{t("emptyRequests")}</p>
          ) : (
            active.slice(0, 4).map((row) => (
              <Link
                key={row.id}
                href={to(`/requests/${row.id}`)}
                className="block rounded-2xl border border-[var(--color-border)] bg-card px-3 py-3 soft-shadow transition active:scale-[0.99]"
              >
                <p className="text-sm font-semibold text-ink">{row.title}</p>
                <p className="text-xs text-muted">{t(statusKey(row.status))}</p>
              </Link>
            ))
          )}
        </section>
      ) : (
        <GuestAuthStrip className="animate-rise-delay" nextPath="/" />
      )}

      {!listing ? (
        <section
          id="for-pros"
          className="space-y-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-sun)_34%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-sun)_12%,var(--color-card))] p-4 soft-shadow"
        >
          <div>
            <p className="type-sign text-[var(--color-ink)]">{t("providerHomeTitle")}</p>
            <p className="mt-1 text-sm leading-snug text-muted">{t("providerHomeBody")}</p>
          </div>
          <Link
            href={to("/register?as=pro")}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-cta)] transition hover:brightness-[1.03] active:scale-[0.98]"
          >
            {t("providerHomeCta")}
          </Link>
        </section>
      ) : null}

      {actor ? (
        <section className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-card p-4 soft-shadow">
          <h2 className="font-display text-sm font-bold tracking-[-0.02em] text-ink">
            {t("shareInvite")}
          </h2>
          <p className="text-sm text-muted">{t("inviteHint")}</p>
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full rounded-full"
            onClick={() => {
              const link = serviceInviteUrl(window.location.origin, { as: "seeker" });
              setInviteLink(link);
              void navigator.clipboard.writeText(link).then(() => setCopied(true));
            }}
          >
            {copied ? t("copied") : t("copyInvite")}
          </Button>
        </section>
      ) : null}

      {saved.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">
            {t("favourites")}
          </h2>
          {saved.map((pro) => (
            <ProCard key={pro.id} pro={pro} />
          ))}
        </section>
      ) : null}
      {recent.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-display text-base font-bold tracking-[-0.02em] text-ink">
            {t("recent")}
          </h2>
          {recent.map((pro) => (
            <ProCard key={pro.id} pro={pro} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
