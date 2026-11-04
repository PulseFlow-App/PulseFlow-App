"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { ServiceDelivery } from "@/lib/pros/delivery";
import { statusKey } from "@/lib/pros/i18n";
import { readMyListingId } from "@/lib/pros/join";
import { needsWorkPermit } from "@/lib/pros/permit";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";

export default function WorkerInboxPage() {
  const { state, actor, actorReady, t } = usePros();
  const pathname = usePathname();
  const router = useRouter();
  const [listingId, setListingId] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<ServiceDelivery[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [nationality, setNationality] = useState<string | null>(null);
  const [nationalityReady, setNationalityReady] = useState(false);
  const [permitFor, setPermitFor] = useState<string | null>(null);
  const to = (path: string) => servicesPath(pathname, path);
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";

  useEffect(() => {
    if (!actorReady) return;
    if (!actor) {
      router.replace(`${start}?mode=sign-in&next=${encodeURIComponent(servicesPath(pathname, "/inbox"))}`);
      return;
    }
    setListingId(readMyListingId());
    void fetch("/api/services/profile", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { profile?: { nationality?: string | null } | null } | null) => {
        setNationality(payload?.profile?.nationality ?? null);
        setNationalityReady(true);
      })
      .catch(() => {
        setNationality(null);
        setNationalityReady(true);
      });
    void fetch("/api/services/requests")
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((payload: { requests?: ServiceDelivery[] }) => {
        const rows = (payload.requests ?? []).filter((row) => row.target_profile_id === actor.id);
        setIncoming(rows);
      })
      .catch(() => setIncoming([]));
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

  const sendReply = (id: string) => {
    const message = (drafts[id] ?? "").trim();
    if (!message) return;
    void fetch("/api/services/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, message }),
    }).then((res) => {
      if (res.ok) setSent((current) => ({ ...current, [id]: true }));
    });
  };

  return (
    <div className="space-y-3">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("messages")}</h1>
      {incoming.map((row) => (
        <article key={row.id} className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
          <p className="text-pf-12 font-medium text-pf-slate-ink">{t("incomingTitle")}</p>
          <p className="text-pf-18 font-medium text-pf-ink">{row.title}</p>
          <p className="whitespace-pre-wrap text-pf-16 text-pf-text-secondary">{row.description}</p>
          {row.when_label ? <p className="text-pf-14 text-pf-text-secondary">{row.when_label}</p> : null}
          {row.reply_message || sent[row.id] ? (
            <p className="text-pf-14 font-medium text-pf-ink">{t("replySent")}</p>
          ) : (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                const message = (drafts[row.id] ?? "").trim();
                if (!message) return;
                if (nationalityReady && needsWorkPermit(nationality)) {
                  setPermitFor(row.id);
                  return;
                }
                sendReply(row.id);
              }}
            >
              <Textarea
                value={drafts[row.id] ?? ""}
                onChange={(event) => setDrafts((current) => ({ ...current, [row.id]: event.target.value }))}
                placeholder={t("replyPlaceholder")}
                aria-label={t("sendReply")}
              />
              <Button type="submit" variant="secondary" className="min-h-11" reflectGlobalBusy={false} disabled={!(drafts[row.id] ?? "").trim()}>
                {t("sendReply")}
              </Button>
            </form>
          )}
        </article>
      ))}
      {!listingId && incoming.length === 0 ? (
        <p className="text-pf-14 text-pf-text-secondary">{t("noInbox")}</p>
      ) : null}
      {listingId && rows.length === 0 && incoming.length === 0 ? <p className="text-pf-14 text-pf-text-secondary">{t("noInbox")}</p> : null}
      {permitFor ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-pf-ink/40 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="permit-title" className="w-full max-w-md rounded-[28px] bg-pf-card p-5">
            <h2 id="permit-title" className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
              {t("permitTitle")}
            </h2>
            <p className="mt-2 text-pf-16 leading-relaxed text-pf-text-secondary">{t("permitBody")}</p>
            <Button
              type="button"
              className="mt-4 min-h-12 w-full"
              reflectGlobalBusy={false}
              onClick={() => {
                const id = permitFor;
                setPermitFor(null);
                sendReply(id);
              }}
            >
              {t("permitContinue")}
            </Button>
            <button
              type="button"
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
              onClick={() => setPermitFor(null)}
            >
              {t("permitNotNow")}
            </button>
          </div>
        </div>
      ) : null}
      {rows.map(({ offer, request }) => (
        <article
          key={offer.id}
          className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-pf-ink">{request?.title}</p>
              <p className="text-pf-14 text-pf-text-secondary">
                {request ? t(statusKey(request.status)) : null}
                {offer.status !== "pending" ? ` · ${offer.status}` : null}
              </p>
            </div>
            {offer.status === "pending" ? (
              <Link
                href={to(`/reply/${offer.token}`)}
                className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-pf-navy-600 px-3 text-pf-14 font-medium text-white"
              >
                {t("replyNow")}
              </Link>
            ) : (
              <Link
                href={to(`/requests/${request?.id}`)}
                className="shrink-0 text-pf-12 font-medium text-pf-text-secondary"
              >
                {t("requests")}
              </Link>
            )}
          </div>
          {offer.message ? <p className="text-pf-16 text-pf-text-secondary">{offer.message}</p> : null}
          {offer.amount != null ? (
            <p className="text-pf-14 font-medium text-pf-ink">
              {offer.amount} {offer.currency ?? ""}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
