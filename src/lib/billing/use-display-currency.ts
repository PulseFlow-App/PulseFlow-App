"use client";

import { useCallback, useEffect, useState } from "react";
import { convertBillAmount } from "@/lib/billing/convert-currency";
import {
  DISPLAY_CURRENCY_EVENT,
  DEFAULT_BILL_CURRENCY,
  normalizeBillCurrency,
  readPreferredBillCurrency,
  rememberPreferredBillCurrency,
  type BillCurrency,
} from "@/lib/billing/currencies";
import { formatMoney, formatMoneyCompact } from "@/lib/utils";

export function useDisplayCurrency() {
  const [displayCurrency, setDisplayCurrencyState] = useState<BillCurrency>(
    DEFAULT_BILL_CURRENCY,
  );

  useEffect(() => {
    setDisplayCurrencyState(readPreferredBillCurrency());
    const sync = () => setDisplayCurrencyState(readPreferredBillCurrency());
    window.addEventListener(DISPLAY_CURRENCY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DISPLAY_CURRENCY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setDisplayCurrency = useCallback((next: BillCurrency) => {
    rememberPreferredBillCurrency(next);
    setDisplayCurrencyState(next);
  }, []);

  const convertToDisplay = useCallback(
    (amount: number, fromCurrency: string) =>
      convertBillAmount(
        amount,
        normalizeBillCurrency(fromCurrency),
        displayCurrency,
      ),
    [displayCurrency],
  );

  const formatDisplay = useCallback(
    (amount: number, fromCurrency: string) =>
      formatMoneyCompact(convertToDisplay(amount, fromCurrency), displayCurrency),
    [convertToDisplay, displayCurrency],
  );

  const formatDisplayCompact = useCallback(
    (amount: number, fromCurrency: string) =>
      formatMoneyCompact(convertToDisplay(amount, fromCurrency), displayCurrency),
    [convertToDisplay, displayCurrency],
  );

  const formatStored = useCallback(
    (amount: number, currency: string) =>
      formatMoneyCompact(amount, normalizeBillCurrency(currency)),
    [],
  );

  const isConverted = useCallback(
    (fromCurrency: string) =>
      normalizeBillCurrency(fromCurrency) !== displayCurrency,
    [displayCurrency],
  );

  return {
    displayCurrency,
    setDisplayCurrency,
    convertToDisplay,
    formatDisplay,
    formatDisplayCompact,
    formatStored,
    isConverted,
  };
}

/** Non-hook helper for exports and server-side-ish builders. */
export function formatAmountInDisplayCurrency(
  amount: number,
  fromCurrency: string,
  displayCurrency: BillCurrency = readPreferredBillCurrency(),
) {
  const from = normalizeBillCurrency(fromCurrency);
  if (from === displayCurrency) {
    return formatMoney(amount, displayCurrency);
  }
  return formatMoney(
    convertBillAmount(amount, from, displayCurrency),
    displayCurrency,
  );
}
