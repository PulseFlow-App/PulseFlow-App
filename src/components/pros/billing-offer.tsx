"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isHireAccount } from "@/lib/pros/intent";
import { usePros } from "@/lib/pros/store";
import { billingMilestone, paymentNoticeDue, SERVICES_PLAN_USD } from "@/lib/pros/trial";

const DISMISS_KEY = "pulseflow.services.billingOffer.v1";
const PAYMENT_KEY = "pulseflow.services.paymentNotice.v1";

type Dismissed = { milestone: string; modal: boolean; notice: boolean };

function readDismissed(actorId: string): Dismissed | null {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, Dismissed>;
    return map[actorId] ?? null;
  } catch {
    return null;
  }
}

function writeDismissed(actorId: string, row: Dismissed) {
  let map: Record<string, Dismissed> = {};
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw) map = JSON.parse(raw) as Record<string, Dismissed>;
  } catch {
    map = {};
  }
  map[actorId] = row;
  localStorage.setItem(DISMISS_KEY, JSON.stringify(map));
}

export function BillingOffer() {
  const { actor, state, plan, setPlan, t } = usePros();
  const hire = isHireAccount(actor);
  const milestone = hire && actor ? billingMilestone(state.requests, state.reviews, actor.id) : null;
  const due = plan.premium ? paymentNoticeDue(plan.nextPaymentAt) : null;
  const [dismissed, setDismissed] = useState<Dismissed | null>(null);
  const [paymentHidden, setPaymentHidden] = useState<string | null>(null);
  const [half, setHalf] = useState(false);

  useEffect(() => {
    if (!actor) return;
    setDismissed(readDismissed(actor.id));
    try {
      const raw = localStorage.getItem(PAYMENT_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      setPaymentHidden(map[actor.id] ?? null);
    } catch {
      setPaymentHidden(null);
    }
  }, [actor]);

  useEffect(() => {
    if (!hire) return;
    let cancelled = false;
    void fetch("/api/services/referral", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { discount?: boolean } | null) => {
        if (!cancelled) setHalf(Boolean(body?.discount));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [hire]);

  useEffect(() => {
    if (!hire || !plan.premium || plan.nextPaymentAt) return;
    setPlan({ premium: true, pro: true });
  }, [hire, plan.premium, plan.nextPaymentAt, setPlan]);

  if (!hire || !actor) return null;

  const price = half ? SERVICES_PLAN_USD / 2 : SERVICES_PLAN_USD;
  const priceLabel = Number.isInteger(price) ? String(price) : price.toFixed(2);
  const sameMilestone = dismissed?.milestone === milestone;
  const showModal = Boolean(milestone) && !plan.premium && !(sameMilestone && dismissed?.modal);
  const showNotice = Boolean(milestone) && !plan.premium && !(sameMilestone && dismissed?.notice);
  const showPayment = Boolean(due) && paymentHidden !== due?.toISOString();

  const dismiss = (part: "modal" | "notice") => {
    if (!milestone) return;
    const next: Dismissed = {
      milestone,
      modal: part === "modal" || Boolean(sameMilestone && dismissed?.modal),
      notice: part === "notice" || Boolean(sameMilestone && dismissed?.notice),
    };
    writeDismissed(actor.id, next);
    setDismissed(next);
  };

  const register = () => {
    setPlan({ premium: true, pro: true });
    if (milestone) {
      const next = { milestone, modal: true, notice: true };
      writeDismissed(actor.id, next);
      setDismissed(next);
    }
  };

  const hidePayment = () => {
    if (!due) return;
    let map: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(PAYMENT_KEY);
      if (raw) map = JSON.parse(raw) as Record<string, string>;
    } catch {
      map = {};
    }
    map[actor.id] = due.toISOString();
    localStorage.setItem(PAYMENT_KEY, JSON.stringify(map));
    setPaymentHidden(due.toISOString());
  };

  const offerBody =
    milestone === "trial" ? t("billingOfferTrial", { price: priceLabel }) : t("billingOfferMonthly", { price: priceLabel });

  return (
    <>
      {showPayment && due ? (
        <p className="mb-3 rounded-[20px] border border-pf-line bg-pf-card px-4 py-3 text-pf-16 leading-relaxed text-pf-ink">
          {t("paymentScheduled", {
            price: priceLabel,
            date: due.toLocaleDateString(undefined, { day: "numeric", month: "long" }),
          })}
          <button type="button" className="mt-2 block text-pf-14 font-medium text-pf-text-secondary" onClick={hidePayment}>
            {t("billingNotNow")}
          </button>
        </p>
      ) : null}
      {showNotice ? (
        <p className="mb-3 rounded-[20px] border border-pf-line bg-pf-card px-4 py-3 text-pf-16 leading-relaxed text-pf-ink">
          {milestone === "trial" ? t("billingNoticeTrial") : t("billingNoticeMonthly")}
          <button type="button" className="mt-2 block text-pf-14 font-medium text-pf-text-secondary" onClick={() => dismiss("notice")}>
            {t("billingNotNow")}
          </button>
        </p>
      ) : null}
      {showModal ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-pf-ink/40 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="billing-offer-title" className="w-full max-w-md rounded-[28px] bg-pf-card p-5">
            <h2 id="billing-offer-title" className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
              {t("billingOfferTitle")}
            </h2>
            <p className="mt-2 text-pf-16 leading-relaxed text-pf-text-secondary">{offerBody}</p>
            <Button type="button" className="mt-4 min-h-12 w-full" reflectGlobalBusy={false} onClick={register}>
              {t("billingRegister")}
            </Button>
            <button
              type="button"
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
              onClick={() => dismiss("modal")}
            >
              {t("billingNotNow")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
