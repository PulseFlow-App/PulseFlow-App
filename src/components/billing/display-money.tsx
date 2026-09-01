"use client";

import { cn } from "@/lib/utils";
import { useDisplayCurrency } from "@/lib/billing/use-display-currency";

export function DisplayMoney({
  amount,
  currency,
  compact = false,
  className,
  originalClassName,
}: {
  amount: number;
  currency: string;
  compact?: boolean;
  className?: string;
  originalClassName?: string;
}) {
  const { formatDisplay, formatDisplayCompact, formatStored, isConverted } =
    useDisplayCurrency();

  const converted = compact
    ? formatDisplayCompact(amount, currency)
    : formatDisplay(amount, currency);

  return (
    <span className={cn("inline-block text-inherit", className)}>
      <span>{converted}</span>
      {isConverted(currency) ? (
        <span
          className={cn(
            "mt-0.5 block text-[11px] font-normal text-muted",
            originalClassName,
          )}
        >
          {formatStored(amount, currency)}
        </span>
      ) : null}
    </span>
  );
}
