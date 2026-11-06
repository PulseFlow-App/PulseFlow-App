"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ServicesAccountGate } from "@/components/pros/parts";
import { QuoteTag } from "@/components/pros/quote-form";
import { isAgreedReply, quoteLabel, type ServiceDelivery } from "@/lib/pros/delivery";
import { servicesPath } from "@/lib/pros/paths";
import { downloadVisitIcs } from "@/lib/pros/visit-calendar";
import { usePros } from "@/lib/pros/store";

export default function RequestsPage() {
  const { state, actor, actorReady, t } = usePros();
  const pathname = usePathname();
  const [remote, setRemote] = useState<ServiceDelivery[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!actor) return;
    let cancel = false;
    void fetch("/api/services/requests", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((body: { requests?: ServiceDelivery[] }) => {
        if (!cancel) setRemote(body.requests ?? []);
      })
      .catch(() => {
        if (!cancel) setRemote([]);
      });
    return () => {
      cancel = true;
    };
  }, [actor, version]);

  const accept = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/services/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "accept" }),
      });
      if (res.ok) setVersion((current) => current + 1);
    } finally {
      setBusy(null);
    }
  };

  const mine = remote.filter((row) => row.created_by === actor?.id);
  const linked = new Set(mine.map((row) => row.request_id));
  const localOnly = state.requests.filter((row) => row.createdBy === actor?.id && !linked.has(row.id));
  const empty = actor != null && mine.length === 0 && localOnly.length === 0;

  return (
    <div className="space-y-3">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("requests")}</h1>
      {actorReady && !actor ? (
        <>
          <p className="text-pf-14 text-pf-text-secondary">{t("ordersEmpty")}</p>
          <ServicesAccountGate next={pathname} />
        </>
      ) : null}
      {empty ? <p className="text-pf-14 text-pf-text-secondary">{t("emptyRequests")}</p> : null}
      {mine.map((row) => {
        const fixed = isAgreedReply(row.reply_message);
        const price = quoteLabel(row);
        return (
          <article
            key={row.id}
            className={
              fixed
                ? "pf-order-fixed space-y-2 rounded-[20px] border border-pf-line p-4"
                : "space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4"
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={servicesPath(pathname, `/chat/${row.id}`)} className="font-medium text-pf-ink">
                  {row.title}
                </Link>
                <p className="text-pf-14 text-pf-text-secondary">
                  {fixed ? t("appointmentReady") : price ? t("quoteSent") : t("waitingQuote")}
                </p>
                {row.when_label ? <p className="text-pf-14 text-pf-text-secondary">{row.when_label}</p> : null}
              </div>
              {price ? <QuoteTag label={price} /> : null}
            </div>
            {price && !fixed ? (
              <button
                type="button"
                disabled={busy === row.id}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pf-navy-600 px-4 text-pf-16 font-medium text-white disabled:opacity-60"
                onClick={() => void accept(row.id)}
              >
                {t("confirmQuote")}
              </button>
            ) : null}
            {fixed ? (
              <button
                type="button"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pf-navy-600 px-4 text-pf-16 font-medium text-white"
                onClick={() =>
                  downloadVisitIcs({
                    id: row.id,
                    title: row.title,
                    whenLabel: row.when_label,
                    details: row.description,
                    who: row.target_name,
                    price: price ? t("calendarPriceLine", { amount: price }) : null,
                  })
                }
              >
                {t("addToCalendar")}
              </button>
            ) : null}
          </article>
        );
      })}
      {localOnly.map((row) => (
        <Link
          key={row.id}
          href={servicesPath(pathname, `/requests/${row.id}`)}
          className="block rounded-[20px] border border-pf-line bg-pf-card p-4"
        >
          <p className="font-medium text-pf-ink">{row.title}</p>
          <p className="text-pf-14 text-pf-text-secondary">{t("waitingQuote")}</p>
        </Link>
      ))}
    </div>
  );
}
