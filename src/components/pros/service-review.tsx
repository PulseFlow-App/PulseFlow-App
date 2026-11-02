"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePros } from "@/lib/pros/store";
import type { ServiceAnswers } from "@/lib/pros/trial";

const QUESTIONS: {
  key: keyof ServiceAnswers;
  label: string;
  options: { value: ServiceAnswers[keyof ServiceAnswers]; label: string }[];
}[] = [
  {
    key: "done",
    label: "Did the work get done?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "partly", label: "Partly" },
      { value: "no", label: "No" },
    ],
  },
  {
    key: "result",
    label: "How was the result?",
    options: [
      { value: "excellent", label: "Excellent" },
      { value: "good", label: "Good" },
      { value: "not", label: "Not what I needed" },
    ],
  },
  {
    key: "again",
    label: "Would you ask this person again?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "maybe", label: "Maybe" },
      { value: "no", label: "No" },
    ],
  },
  {
    key: "complicated",
    label: "Was ordering too complicated?",
    options: [
      { value: "no", label: "No" },
      { value: "a_bit", label: "A bit" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    key: "reply",
    label: "How fast was the reply?",
    options: [
      { value: "same_day", label: "Same day" },
      { value: "few_days", label: "Within a few days" },
      { value: "slow", label: "Too slow" },
      { value: "none", label: "No reply" },
    ],
  },
  {
    key: "clear",
    label: "Could you tell what would happen next?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "not_really", label: "Not really" },
    ],
  },
];

export function ServiceReviewForm({ requestId }: { requestId: string }) {
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
          setError("Answer each question to unlock the next order.");
          return;
        }
        const result = addReview({ requestId, answers: answers as ServiceAnswers });
        if (!result.ok) setError("The review could not be saved.");
      }}
    >
      <div>
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("review")}</h2>
        <p className="mt-1 text-pf-14 text-pf-text-secondary">{t("reviewUnlocks")}</p>
      </div>
      {QUESTIONS.map((question) => (
        <fieldset key={question.key} className="space-y-2">
          <legend className="text-pf-14 font-medium text-pf-ink">{question.label}</legend>
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
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
      <Button type="submit" className="min-h-12 w-full" disabled={!ready}>
        {t("review")}
      </Button>
    </form>
  );
}
