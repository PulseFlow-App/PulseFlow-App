"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HomeScreen } from "@/components/pros/home-screen";
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

  if (worker && listing) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("workerHome")}</h1>
          <p className="mt-1 text-pf-14 text-pf-text-secondary">{listing.name}</p>
        </div>

        <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
          <h2 className="text-pf-14 font-medium text-pf-ink">{t("listingStatus")}</h2>
          <p className="text-pf-14 text-pf-text-secondary">
            {listing.status === "suspended"
              ? t("suspend")
              : listing.visibility === "public"
                ? t("listingOpen")
                : t("listingHidden")}
          </p>
          {profileGaps ? <p className="text-pf-14 text-pf-text-secondary">{t("profileChecklist")}</p> : null}
          <Link href={to("/settings")} className="inline-flex text-pf-14 font-medium text-pf-text-secondary">
            {t("settings")}
          </Link>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-pf-14 font-medium text-pf-ink">{t("inbox")}</h2>
            <Link href={to("/inbox")} className="text-pf-12 font-medium text-pf-text-secondary">
              {t("inbox")}
            </Link>
          </div>
          {inboxPending.length === 0 ? <p className="text-pf-14 text-pf-text-secondary">{t("noInbox")}</p> : null}
          {inboxPending.slice(0, 3).map((offer) => {
            const request = state.requests.find((row) => row.id === offer.requestId);
            return (
              <Link
                key={offer.id}
                href={to(`/reply/${offer.token}`)}
                className="block rounded-[20px] border border-pf-line bg-pf-card px-3 py-3"
              >
                <p className="text-pf-14 font-medium text-pf-ink">{request?.title ?? t("replyNow")}</p>
                <p className="text-pf-12 text-pf-slate-ink">{t("replyNow")}</p>
              </Link>
            );
          })}
        </section>

        <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
          <h2 className="text-pf-14 font-medium text-pf-ink">{t("nextJob")}</h2>
          {nextJob ? (
            <Link href={to(`/requests/${nextJob.id}`)} className="block">
              <p className="text-pf-14 font-medium text-pf-ink">{nextJob.title}</p>
              <p className="text-pf-12 text-pf-slate-ink">{t(statusKey(nextJob.status))}</p>
            </Link>
          ) : (
            <p className="text-pf-14 text-pf-text-secondary">{t("noInbox")}</p>
          )}
        </section>

        <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
          <h2 className="text-pf-14 font-medium text-pf-ink">{t("shareInvite")}</h2>
          <p className="text-pf-14 text-pf-text-secondary">{t("inviteHint")}</p>
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
          {inviteLink ? <p className="break-all text-pf-12 text-pf-slate-ink">{inviteLink}</p> : null}
        </section>
      </div>
    );
  }

  return <HomeScreen />;
}
