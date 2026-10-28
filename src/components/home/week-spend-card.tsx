"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { formatAmountInDisplayCurrency } from "@/lib/billing/use-display-currency";
import type { BillCurrency } from "@/lib/billing/currencies";

export function WeekSpendCard({
  spend,
  pending,
  displayCurrency,
}: {
  spend: number;
  pending: number;
  displayCurrency: BillCurrency;
}) {
  const { t } = useI18n();
  const spendLabel = formatAmountInDisplayCurrency(
    spend,
    displayCurrency,
    displayCurrency,
  );
  const pendingLabel = formatAmountInDisplayCurrency(
    pending,
    displayCurrency,
    displayCurrency,
  );

  return (
    <Card className="flex items-center justify-between gap-3 p-4 md:p-5">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("home.weekSpendTitle")}
        </p>
        <p className="mt-1 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {spendLabel}
        </p>
        <p className="mt-1 text-sm text-muted">
          {t("home.weekSpendPending", { amount: pendingLabel })}
        </p>
      </div>
      <Link
        href="/bills"
        className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        {t("home.weekSpendCta")}
      </Link>
    </Card>
  );
}
