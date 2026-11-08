"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProsKey } from "@/lib/pros/i18n";
import { usePros } from "@/lib/pros/store";
import type { ServiceAnswers } from "@/lib/pros/trial";

const QUESTIONS: {
  key: keyof ServiceAnswers;
  labelKey: ProsKey;
  options: { value: ServiceAnswers[keyof ServiceAnswers]; labelKey: ProsKey }[];
}[] = [
  {
    key: "done",
    labelKey: "reviewQDone",
    options: [
      { value: "yes", labelKey: "reviewAYes" },
      { value: "partly", labelKey: "reviewAPartly" },
      { value: "no", labelKey: "reviewANo" },
    ],
  },
  {
    key: "result",
    labelKey: "reviewQResult",
    options: [
      { value: "excellent", labelKey: "reviewAExcellent" },
      { value: "good", labelKey: "reviewAGood" },
      { value: "not", labelKey: "reviewANotNeeded" },
    ],
  },
  {
    key: "again",
    labelKey: "reviewQAgain",
    options: [
      { value: "yes", labelKey: "reviewAYes" },
      { value: "maybe", labelKey: "reviewAMaybe" },
      { value: "no", labelKey: "reviewANo" },
    ],
  },
  {
    key: "complicated",
    labelKey: "reviewQComplicated",
    options: [
      { value: "no", labelKey: "reviewANo" },
      { value: "a_bit", labelKey: "reviewAABit" },
      { value: "yes", labelKey: "reviewAYes" },
    ],
  },
  {
    key: "reply",
    labelKey: "reviewQReply",
    options: [
      { value: "same_day", labelKey: "reviewASameDay" },
      { value: "few_days", labelKey: "reviewAFewDays" },
      { value: "slow", labelKey: "reviewASlow" },
      { value: "none", labelKey: "reviewANone" },
    ],
  },
  {
    key: "clear",
    labelKey: "reviewQClear",
    options: [
      { value: "yes", labelKey: "reviewAYes" },
      { value: "not_really", labelKey: "reviewANotReally" },
    ],
  },
];

export function ServiceReviewForm({
  requestId,
  onSaved,
}: {
  requestId: string;
  onSaved?: () => void;
}) {
  const { t, addReview } = usePros();
  const [answers, setAnswers] = useState<Partial<ServiceAnswers>>({});
  const [error, setError] = useState<string | null>(null);
  const ready = QUESTIONS.every((question) => answers[question.key]);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) {
          setError(t("reviewAnswerAll"));
          return;
        }
        void addReview({ requestId, answers: answers as ServiceAnswers }).then((result) => {
          if (!result.ok) {
            setError(t("reviewSaveFailed"));
            return;
          }
          onSaved?.();
        });
      }}
    >
      <div>
        <h2 id="review-title" className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
          {t("review")}
        </h2>
        <p className="mt-2 text-pf-14 text-pf-text-secondary">{t("reviewUnlocks")}</p>
      </div>
      {QUESTIONS.map((question) => (
        <fieldset key={question.key} className="space-y-2">
          <legend className="text-pf-14 font-medium text-pf-ink">{t(question.labelKey)}</legend>
          <div className="flex flex-wrap gap-2">
            {question.options.map((option) => {
              const active = answers[question.key] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.key]: option.value }))}
                  className={
                    active
                      ? "min-h-11 rounded-full bg-pf-peach-100 px-3 text-pf-14 font-medium text-pf-ink"
                      : "min-h-11 rounded-full border border-pf-line bg-pf-card px-3 text-pf-14 font-medium text-pf-ink"
                  }
                >
                  {t(option.labelKey)}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
      <Button type="submit" className="min-h-12 w-full" disabled={!ready}>
        {t("reviewSubmit")}
      </Button>
    </form>
  );
}

/** Blocking review after Job done — no dismiss until the review is saved. */
export function ServiceReviewModal({ requestId }: { requestId: string }) {
  const { t } = usePros();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-pf-ink/50 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
        aria-describedby="review-required-note"
        className="max-h-[min(92vh,40rem)] w-full max-w-md overflow-y-auto rounded-[28px] bg-pf-card p-5 shadow-pf-2"
      >
        <p id="review-required-note" className="mb-3 rounded-[14px] bg-pf-peach-100 px-3 py-2 text-pf-14 font-medium text-pf-ink">
          {t("reviewObligatory")}
        </p>
        <ServiceReviewForm requestId={requestId} />
      </div>
    </div>
  );
}
