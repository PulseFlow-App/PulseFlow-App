"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { statusKey } from "@/lib/pros/i18n";
import { readMyListingId } from "@/lib/pros/join";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";

export default function WorkerInboxPage() {
  const { state, actor, actorReady, t } = usePros();
  const pathname = usePathname();
  const router = useRouter();
  const [listingId, setListingId] = useState<string | null>(null);
  const to = (path: string) => servicesPath(pathname, path);
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";

  useEffect(() => {
    if (!actorReady) return;
    if (!actor) {
      router.replace(`${start}?mode=sign-in&next=${encodeURIComponent(servicesPath(pathname, "/inbox"))}`);
      return;
    }
    setListingId(readMyListingId());
  }, [actor, actorReady, pathname, router, start]);

  const rows = useMemo(() => {
    if (!listingId) return [];
    return state.offers
      .filter((offer) => offer.profileId === listingId)
      .map((offer) => {
        const request = state.requests.find((row) => row.id === offer.requestId);
        return { offer, request };
      })
      .filter((row) => row.request)
      .sort((a, b) => (b.offer.createdAt > a.offer.createdAt ? 1 : -1));
  }, [listingId, state.offers, state.requests]);

  if (!actor) return null;

  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-semibold text-ink">{t("inbox")}</h1>
      {!listingId ? (
        <p className="text-sm text-muted">{t("noInbox")}</p>
      ) : null}
      {listingId && rows.length === 0 ? <p className="text-sm text-muted">{t("noInbox")}</p> : null}
      {rows.map(({ offer, request }) => (
        <article
          key={offer.id}
          className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-card p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{request?.title}</p>
              <p className="text-sm text-muted">
                {request ? t(statusKey(request.status)) : null}
                {offer.status !== "pending" ? ` · ${offer.status}` : null}
              </p>
            </div>
            {offer.status === "pending" ? (
              <Link
                href={to(`/reply/${offer.token}`)}
                className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
              >
                {t("replyNow")}
              </Link>
            ) : (
              <Link
                href={to(`/requests/${request?.id}`)}
                className="shrink-0 text-xs font-semibold text-primary"
              >
                {t("requests")}
              </Link>
            )}
          </div>
          {offer.message ? <p className="text-sm text-ink/80">{offer.message}</p> : null}
          {offer.amount != null ? (
            <p className="text-sm font-semibold text-ink">
              {offer.amount} {offer.currency ?? ""}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
