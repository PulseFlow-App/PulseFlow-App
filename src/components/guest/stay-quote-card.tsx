"use client";

import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { DisplayMoney } from "@/components/billing/display-money";
import { formatShortDate } from "@/lib/utils";
import type { StayDateRequest } from "@/lib/types";
import { nightsBetween } from "@/lib/guest/stay-pricing";

export function StayQuoteCard({ request }: { request: StayDateRequest }) {
  const { t } = useI18n();
  if (
    request.status !== "accepted" ||
    request.quoted_price_amount == null ||
    !request.quoted_price_currency
  ) {
    return null;
  }

  const nights = nightsBetween(request.check_in, request.check_out);

  return (
    <Card className="space-y-2 border border-secondary/20 bg-secondary/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-secondary">
        {t("guest.quoteTitle")}
      </p>
      <p className="font-display text-2xl font-bold text-ink">
        <DisplayMoney
          amount={Number(request.quoted_price_amount)}
          currency={request.quoted_price_currency}
        />
      </p>
      <p className="text-sm text-muted">
        {nights} {nights === 1 ? "night" : "nights"} ·{" "}
        {formatShortDate(request.check_in)} → {formatShortDate(request.check_out)}
      </p>
      {request.payment_note ? (
        <div className="rounded-xl bg-white/80 p-3 text-sm text-ink">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            {t("guest.quotePayment")}
          </p>
          <p className="mt-1">{request.payment_note}</p>
        </div>
      ) : null}
      <p className="text-xs text-muted">{t("guest.depositManualHint")}</p>
    </Card>
  );
}
