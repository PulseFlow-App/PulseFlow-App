"use client";

import { useState } from "react";
import { usePros } from "@/lib/pros/store";

export type QuoteInput = {
  min: number;
  max: number | null;
  currency: string;
};

export function QuoteForm({
  busy,
  submitLabel,
  onSubmit,
}: {
  busy?: boolean;
  submitLabel: string;
  onSubmit: (quote: QuoteInput) => void;
}) {
  const { t } = usePros();
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [currency, setCurrency] = useState("THB");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const low = Number(min);
        const high = max.trim() ? Number(max) : null;
        if (!Number.isFinite(low) || low < 0 || (high != null && (!Number.isFinite(high) || high < low))) {
          setError(t("quoteNeedPrice"));
          return;
        }
        setError(null);
        onSubmit({ min: low, max: high, currency });
      }}
    >
      <p className="text-pf-14 leading-relaxed text-pf-text-secondary">{t("quoteHint")}</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          inputMode="decimal"
          value={min}
          onChange={(event) => setMin(event.target.value)}
          placeholder={t("quoteFrom")}
          aria-label={t("quoteFrom")}
          className="min-h-11 rounded-[14px] border border-pf-line bg-pf-page px-3 text-pf-16 text-pf-ink outline-none"
        />
        <input
          inputMode="decimal"
          value={max}
          onChange={(event) => setMax(event.target.value)}
          placeholder={t("quoteTo")}
          aria-label={t("quoteTo")}
          className="min-h-11 rounded-[14px] border border-pf-line bg-pf-page px-3 text-pf-16 text-pf-ink outline-none"
        />
      </div>
      <select
        value={currency}
        onChange={(event) => setCurrency(event.target.value)}
        aria-label={t("quoteCurrency")}
        className="min-h-11 w-full rounded-[14px] border border-pf-line bg-pf-page px-3 text-pf-16 text-pf-ink outline-none"
      >
        <option value="THB">THB</option>
        <option value="USD">USD</option>
      </select>
      {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pf-navy-600 px-4 text-pf-16 font-medium text-white disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export function QuoteModal({
  open,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (quote: QuoteInput) => void;
}) {
  const { t } = usePros();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-pf-ink/40 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="quote-title" className="w-full max-w-md space-y-3 rounded-[28px] bg-pf-card p-5">
        <h2 id="quote-title" className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
          {t("provideQuote")}
        </h2>
        <QuoteForm busy={busy} submitLabel={t("sendQuote")} onSubmit={onSubmit} />
        <button
          type="button"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
          onClick={onClose}
        >
          {t("permitNotNow")}
        </button>
      </div>
    </div>
  );
}

export function QuoteTag({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-pf-navy-900 px-3 py-1 text-pf-14 font-medium text-white">
      {label}
    </span>
  );
}
