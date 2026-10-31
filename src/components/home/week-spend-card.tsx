"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card className="flex items-center justify-between gap-3 px-3 py-2.5 md:px-4 md:py-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/65">
          {t("home.weekSpendTitle")}
        </p>
        <p className="mt-0.5 font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
          {spendLabel}
        </p>
        <p className="mt-0.5 text-sm text-ink/70">
          {t("home.weekSpendPending", { amount: pendingLabel })}
        </p>
      </div>
      <Link href="/bills">
        <Button size="sm">{t("home.weekSpendCta")}</Button>
      </Link>
    </Card>
  );
}
