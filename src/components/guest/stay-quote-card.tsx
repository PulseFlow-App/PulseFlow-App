"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { DisplayCurrencySelect } from "@/components/billing/display-currency-select";
import { useDisplayCurrency } from "@/lib/billing/use-display-currency";
import { formatShortDate, formatMoney } from "@/lib/utils";
import type { GuestDeposit, StayDateRequest } from "@/lib/types";
import { nightsBetween } from "@/lib/guest/stay-pricing";

export function StayQuoteCard({
  request,
  deposit,
  onConfirm,
  onDecline,
  busy = false,
}: {
  request: StayDateRequest;
  deposit?: GuestDeposit | null;
  onConfirm?: () => void;
  onDecline?: () => void;
  busy?: boolean;
}) {
  const { t } = useI18n();
  const { convertToDisplay, displayCurrency } = useDisplayCurrency();
  const isQuoted = request.status === "quoted";
  const isAccepted = request.status === "accepted";

  if (
    (!isQuoted && !isAccepted) ||
    request.quoted_price_amount == null ||
    !request.quoted_price_currency
  ) {
    return null;
  }

  const nights = nightsBetween(request.check_in, request.check_out);
  const priceDisplay = convertToDisplay(
    Number(request.quoted_price_amount),
    request.quoted_price_currency,
  );
  const hasQuotedDeposit =
    request.quoted_deposit_amount != null &&
    request.quoted_deposit_amount > 0 &&
    request.quoted_deposit_currency;
  const depositPaid = deposit ? deposit.status !== "due" : false;
  const depositDisplay =
    deposit && deposit.amount > 0
      ? convertToDisplay(Number(deposit.amount), deposit.currency)
      : hasQuotedDeposit
        ? convertToDisplay(
            Number(request.quoted_deposit_amount),
            request.quoted_deposit_currency!,
          )
        : null;
  const depositTiming =
    deposit?.deposit_timing ?? request.quoted_deposit_timing;
  const showDeposit = depositDisplay != null && (deposit || hasQuotedDeposit);

  if (isAccepted) {
    return (
      <Card className="space-y-4 border border-secondary/20 bg-secondary/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">
              {t("guest.quoteTitle")}
            </p>
            <p className="font-display text-2xl font-bold text-ink">
              {formatMoney(priceDisplay, displayCurrency)}
            </p>
          </div>
          <DisplayCurrencySelect
            aria-label={t("bills.currency")}
            className="max-w-[9rem] shrink-0"
          />
        </div>

        <p className="text-sm text-muted">
          {nights} {nights === 1 ? "night" : "nights"} ·{" "}
          {formatShortDate(request.check_in)} →{" "}
          {formatShortDate(request.check_out)}
        </p>

        {showDeposit ? (
          <div className="space-y-2 rounded-xl bg-white/80 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              {t("guest.yourDeposit")}
            </p>
            <p className="font-display text-xl font-bold text-ink">
              {formatMoney(depositDisplay, displayCurrency)}
              <span className="ml-2 text-sm font-semibold text-muted">
                ·{" "}
                {depositPaid
                  ? t("guest.depositPaid")
                  : t("guest.depositDue")}
              </span>
            </p>
            {depositTiming ? (
              <p className="text-sm text-muted">
                {t(`guest.depositTiming.${depositTiming}`)}
              </p>
            ) : null}
            {!depositPaid ? (
              <div className="space-y-1 border-t border-black/5 pt-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  {t("guest.depositHowToPay")}
                </p>
                <p className="text-sm text-ink">{t("guest.depositHowToPayHint")}</p>
                <Link
                  href="/messages"
                  className="inline-block text-sm font-bold text-primary"
                >
                  {t("guest.openSupportChat")} →
                </Link>
              </div>
            ) : (
              <p className="text-xs lowercase text-muted">
                {t("guest.deposit")} · {t("guest.depositPaid")}
              </p>
            )}
          </div>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="space-y-2 border border-secondary/20 bg-secondary/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-secondary">
        {t("guest.quoteAwaitingTitle")}
      </p>
      <p className="text-sm text-muted">{t("guest.quoteAwaitingHint")}</p>
      <p className="font-display text-2xl font-bold text-ink">
        {formatMoney(priceDisplay, displayCurrency)}
      </p>
      {hasQuotedDeposit ? (
        <p className="text-sm font-semibold text-ink">
          {t("guest.quoteDeposit", {
            amount: formatMoney(
              convertToDisplay(
                Number(request.quoted_deposit_amount),
                request.quoted_deposit_currency!,
              ),
              displayCurrency,
            ),
          })}
          {request.quoted_deposit_timing ? (
            <span className="font-normal text-muted">
              {" "}
              · {t(`guest.depositTiming.${request.quoted_deposit_timing}`)}
            </span>
          ) : null}
        </p>
      ) : null}
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
      {onConfirm && onDecline ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" disabled={busy} onClick={onConfirm}>
            {t("guest.quoteConfirm")}
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={onDecline}>
            {t("guest.quoteDecline")}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
