"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DisplayCurrencySelect } from "@/components/billing/display-currency-select";
import { DisplayMoney } from "@/components/billing/display-money";
import { useData } from "@/lib/data/use-app-data";
import { useDisplayCurrency } from "@/lib/billing/use-display-currency";
import { formatMoney } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { isDepositPaid } from "@/lib/guest/deposit-from-quote";

export function GuestBillsView() {
  const data = useData();
  const { t } = useI18n();
  const { convertToDisplay, displayCurrency } = useDisplayCurrency();
  const stay = data.activeStay;
  const deposit = stay
    ? data.guestDeposits.find((d) => d.stay_id === stay.id)
    : null;
  const charges = stay
    ? data.guestCharges.filter((c) => c.stay_id === stay.id)
    : [];

  if (!stay) {
    return (
      <EmptyState
        title={t("guest.billsTitle")}
        description={t("guest.billsNoStay")}
      />
    );
  }

  const deducted = charges.reduce(
    (sum, c) => sum + convertToDisplay(Number(c.amount), c.currency),
    0,
  );
  const held = deposit
    ? convertToDisplay(Number(deposit.amount), deposit.currency)
    : 0;
  const refunded = deposit
    ? convertToDisplay(Number(deposit.refunded_amount), deposit.currency)
    : 0;
  const remaining = Math.max(0, held - deducted - refunded);
  const depositDue = deposit?.status === "due";

  return (
    <div className="space-y-4 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {t("guest.billsTitle")}
          </h1>
          <p className="text-sm text-muted">{t("guest.billsHint")}</p>
        </div>
        <DisplayCurrencySelect
          aria-label={t("bills.currency")}
          className="max-w-[9rem] shrink-0"
        />
      </div>

      {deposit ? (
        depositDue ? (
          <Card className="space-y-2 border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
              {t("guest.yourDeposit")}
            </p>
            <p className="font-display text-3xl font-bold text-ink">
              {formatMoney(held, displayCurrency)}
            </p>
            <p className="text-sm font-semibold text-amber-900">
              {t("guest.depositDue")}
              {deposit.deposit_timing ? (
                <>
                  {" · "}
                  {t(`guest.depositTiming.${deposit.deposit_timing}`)}
                </>
              ) : null}
            </p>
            <div className="space-y-1 pt-1">
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
          </Card>
        ) : (
          <Card className="space-y-2 bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">
              {t("guest.yourDeposit")}
            </p>
            <p className="font-display text-3xl font-bold">
              {formatMoney(held, displayCurrency)}
            </p>
            {deposit.status === "partial" || deposit.status === "refunded" ? (
              <p className="text-sm text-white/90">
                {t(`guest.depositStatus.${deposit.status}`)}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
              <div>
                <p className="text-white/70">{t("guest.deductions")}</p>
                <p className="font-bold">
                  {formatMoney(deducted, displayCurrency)}
                </p>
              </div>
              <div>
                <p className="text-white/70">{t("guest.remaining")}</p>
                <p className="font-bold">
                  {formatMoney(remaining, displayCurrency)}
                </p>
              </div>
            </div>
            {deposit.notes && !isDepositPaid(deposit) ? (
              <p className="pt-1 text-xs text-white/80">
                <LocalizedText text={deposit.notes} />
              </p>
            ) : null}
          </Card>
        )
      ) : (
        <Card className="p-4 text-sm text-muted">{t("guest.noDeposit")}</Card>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          {t("guest.charges")}
        </h2>
        {charges.length === 0 ? (
          <Card className="p-4 text-sm text-muted">{t("guest.noCharges")}</Card>
        ) : (
          charges.map((c) => (
            <Card key={c.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    <LocalizedText text={c.description} />
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <DisplayMoney
                  amount={Number(c.amount)}
                  currency={c.currency}
                  className="shrink-0 font-bold text-ink"
                />
              </div>
              {c.proof_photo_url ? (
                <a
                  href={c.proof_photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm font-bold text-primary"
                >
                  {t("guest.viewProof")} →
                </a>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
