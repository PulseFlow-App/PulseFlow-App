"use client";

import {
  BILL_CURRENCIES,
  billCurrencyLabel,
  normalizeBillCurrency,
  type BillCurrency,
} from "@/lib/billing/currencies";
import { useDisplayCurrency } from "@/lib/billing/use-display-currency";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DisplayCurrencySelect({
  className,
  selectClassName,
  id,
  "aria-label": ariaLabel,
}: {
  className?: string;
  selectClassName?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();

  return (
    <Select
      id={id}
      aria-label={ariaLabel}
      value={displayCurrency}
      onChange={(e) =>
        setDisplayCurrency(normalizeBillCurrency(e.target.value) as BillCurrency)
      }
      className={cn(className, selectClassName)}
    >
      {BILL_CURRENCIES.map((code) => (
        <option key={code} value={code}>
          {billCurrencyLabel(code)}
        </option>
      ))}
    </Select>
  );
}
