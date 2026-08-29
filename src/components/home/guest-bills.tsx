"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { formatMoney } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function GuestBillsView() {
  const data = useData();
  const { t } = useI18n();
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

  const deducted = charges.reduce((sum, c) => sum + Number(c.amount), 0);
  const held = deposit ? Number(deposit.amount) : 0;
  const refunded = deposit ? Number(deposit.refunded_amount) : 0;
  const remaining = Math.max(0, held - deducted - refunded);

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("guest.billsTitle")}
        </h1>
        <p className="text-sm text-muted">{t("guest.billsHint")}</p>
      </div>

      {deposit ? (
        <Card className="space-y-2 bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-white/80">
            {t("guest.deposit")}
          </p>
          <p className="font-display text-3xl font-bold">
            {formatMoney(held, deposit.currency)}
          </p>
          <p className="text-sm text-white/90">
            {t(`guest.depositStatus.${deposit.status}`)}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
            <div>
              <p className="text-white/70">{t("guest.deductions")}</p>
              <p className="font-bold">
                {formatMoney(deducted, deposit.currency)}
              </p>
            </div>
            <div>
              <p className="text-white/70">{t("guest.remaining")}</p>
              <p className="font-bold">
                {formatMoney(remaining, deposit.currency)}
              </p>
            </div>
          </div>
          {deposit.notes ? (
            <p className="pt-1 text-xs text-white/80">{deposit.notes}</p>
          ) : null}
        </Card>
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
            <Card key={c.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-ink">{c.description}</p>
                <p className="text-xs text-muted">
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="shrink-0 font-bold text-ink">
                {formatMoney(Number(c.amount), c.currency)}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
