"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isAgreedReply, quoteLabel, type ServiceDelivery } from "@/lib/pros/delivery";
import { isHireAccount } from "@/lib/pros/intent";
import { usePros } from "@/lib/pros/store";
import { downloadVisitIcs } from "@/lib/pros/visit-calendar";

const DISMISS_KEY = "pulseflow.services.visitNotice.v1";

function readDismissed(actorId: string) {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return [] as string[];
    const map = JSON.parse(raw) as Record<string, string[]>;
    return map[actorId] ?? [];
  } catch {
    return [] as string[];
  }
}

function dismiss(actorId: string, id: string) {
  let map: Record<string, string[]> = {};
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw) map = JSON.parse(raw) as Record<string, string[]>;
  } catch {
    map = {};
  }
  const ids = new Set(map[actorId] ?? []);
  ids.add(id);
  map[actorId] = [...ids];
  localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
}

/** Hire accounts see that the person they asked has agreed and is coming. */
export function VisitNotice() {
  const { actor, t } = usePros();
  const hire = isHireAccount(actor);
  const [row, setRow] = useState<ServiceDelivery | null>(null);

  useEffect(() => {
    if (!hire || !actor || actor.id.startsWith("local")) {
      setRow(null);
      return;
    }
    const actorId = actor.id;
    let cancel = false;
    const load = () => {
      void fetch("/api/services/requests", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { requests: [] }))
        .then((payload: { requests?: ServiceDelivery[] }) => {
          if (cancel) return;
          const seen = readDismissed(actorId);
          const next = (payload.requests ?? []).find(
            (item) => item.created_by === actorId && isAgreedReply(item.reply_message) && !seen.includes(item.id),
          );
          setRow(next ?? null);
        })
        .catch(() => {
          if (!cancel) setRow(null);
        });
    };
    load();
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", load);
    return () => {
      cancel = true;
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", load);
    };
  }, [actor, hire]);

  if (!row || !actor) return null;

  const close = () => {
    dismiss(actor.id, row.id);
    setRow(null);
  };

  return (
    <section className="mb-4 rounded-[20px] border border-pf-line bg-pf-card p-4">
      <h2 className="text-pf-18 font-medium text-pf-ink">{t("staffComing", { name: row.target_name })}</h2>
      {row.when_label ? <p className="mt-1 text-pf-14 text-pf-text-secondary">{row.when_label}</p> : null}
      <p className="mt-2 text-pf-16 text-pf-text-secondary">{t("staffComingBody")}</p>
      <button
        type="button"
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pf-navy-600 px-4 text-pf-16 font-medium text-white"
        onClick={() => {
          downloadVisitIcs({
            id: row.id,
            title: row.title,
            whenLabel: row.when_label,
            details: row.description,
            who: row.target_name,
            price: quoteLabel(row) ? t("calendarPriceLine", { amount: quoteLabel(row)! }) : null,
          });
          close();
        }}
      >
        {t("addToCalendar")}
      </button>
      <button
        type="button"
        className="mt-2 inline-flex min-h-11 w-full items-center justify-center text-pf-14 font-medium text-pf-text-secondary"
        onClick={close}
      >
        {t("calendarLater")}
      </button>
    </section>
  );
}

export function VisitCalendarSheet({
  visit,
  onClose,
}: {
  visit: {
    id: string;
    title: string;
    whenLabel: string | null;
    details?: string | null;
    who?: string | null;
    price?: string | null;
  } | null;
  onClose: () => void;
}) {
  const { t } = usePros();
  if (!visit) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-pf-ink/40 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="visit-calendar-title" className="w-full max-w-md rounded-[28px] bg-pf-card p-5">
        <h2 id="visit-calendar-title" className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
          {t("agreedComing")}
        </h2>
        {visit.whenLabel ? <p className="mt-2 text-pf-16 text-pf-ink">{visit.whenLabel}</p> : null}
        <p className="mt-2 text-pf-16 leading-relaxed text-pf-text-secondary">{t("staffComingBody")}</p>
        <Button
          type="button"
          className="mt-4 min-h-12 w-full"
          reflectGlobalBusy={false}
          onClick={() => {
            downloadVisitIcs({
              id: visit.id,
              title: visit.title,
              whenLabel: visit.whenLabel,
              details: visit.details,
              who: visit.who,
              price: visit.price,
            });
            onClose();
          }}
        >
          {t("addToCalendar")}
        </Button>
        <button
          type="button"
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
          onClick={onClose}
        >
          {t("calendarLater")}
        </button>
      </div>
    </div>
  );
}
