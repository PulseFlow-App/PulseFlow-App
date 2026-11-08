"use client";

import { useMemo, useState } from "react";
import { usePros } from "@/lib/pros/store";
import { isClockTime, normalizeClock } from "@/lib/pros/when-label";

export type QuoteInput = {
  min: number;
  max: number | null;
  currency: string;
  note: string;
  visitTime: string;
};

function parseAmount(raw: string) {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return Number.NaN;
  return Number(cleaned);
}

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
  const [note, setNote] = useState("");
  const [visitTime, setVisitTime] = useState("10:00");
  const [error, setError] = useState<string | null>(null);

  const ready = useMemo(() => {
    const low = parseAmount(min);
    const high = max.trim() ? parseAmount(max) : null;
    if (!Number.isFinite(low) || low < 0) return false;
    if (high != null && (!Number.isFinite(high) || high < low)) return false;
    if (!isClockTime(visitTime)) return false;
    return true;
  }, [min, max, visitTime]);

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        const low = parseAmount(min);
        const high = max.trim() ? parseAmount(max) : null;
        if (!Number.isFinite(low) || low < 0 || (high != null && (!Number.isFinite(high) || high < low))) {
          setError(t("quoteNeedPrice"));
          return;
        }
        if (!isClockTime(visitTime)) {
          setError(t("needVisitTime"));
          return;
        }
        setError(null);
        onSubmit({
          min: low,
          max: high,
          currency,
          note: note.trim(),
          visitTime: normalizeClock(visitTime),
        });
      }}
    >
      <p className="text-pf-14 leading-relaxed text-pf-text-secondary">{t("quoteHint")}</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          inputMode="decimal"
          value={min}
          onChange={(event) => {
            setMin(event.target.value);
            if (error) setError(null);
          }}
          placeholder={t("quoteFrom")}
          aria-label={t("quoteFrom")}
          className="min-h-11 rounded-[14px] border border-pf-line bg-pf-page px-3 text-pf-16 text-pf-ink outline-none"
        />
        <input
          inputMode="decimal"
          value={max}
          onChange={(event) => {
            setMax(event.target.value);
            if (error) setError(null);
          }}
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
      <div>
        <label htmlFor="quote-visit-time" className="mb-1 block text-pf-12 font-medium text-pf-slate-ink">
          {t("visitTime")}
        </label>
        <p className="mb-1 text-pf-12 text-pf-slate-ink">{t("visitTimeHint")}</p>
        <input
          id="quote-visit-time"
          type="time"
          value={visitTime}
          step={900}
          required
          onChange={(event) => {
            setVisitTime(event.target.value || "10:00");
            if (error) setError(null);
          }}
          aria-label={t("visitTime")}
          className="min-h-11 w-full rounded-[14px] border border-pf-line bg-pf-page px-3 text-pf-16 text-pf-ink outline-none"
        />
      </div>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={t("quoteNoteHint")}
        aria-label={t("quoteNote")}
        rows={3}
        maxLength={500}
        className="w-full resize-none rounded-[14px] border border-pf-line bg-pf-page px-3 py-2 text-pf-16 text-pf-ink outline-none"
      />
      {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
      <button
        type="submit"
        disabled={Boolean(busy) || !ready}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white disabled:opacity-60"
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
