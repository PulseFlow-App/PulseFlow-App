"use client";

import { Check, Circle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEducation } from "@/lib/education/provider";
import { EDUCATION_STEPS } from "@/lib/education/steps";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function EducationChecklist() {
  const { t } = useI18n();
  const edu = useEducation();
  if (edu.uiMode !== "checklist") return null;

  return (
    <div className="fixed inset-0 z-[230] flex items-end justify-center p-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label={t("common.close")}
        onClick={edu.closeChecklist}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("education.checklistTitle")}
        className="relative z-10 w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-card p-4 soft-shadow"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">
            {t("education.checklistTitle")}
          </h2>
          <p className="text-sm font-semibold text-ink/70">
            {t("education.percent", { percent: edu.percent })}
          </p>
        </div>
        <ul className="space-y-2" aria-live="polite">
          {EDUCATION_STEPS.map((s, i) => {
            const status = edu.stepsMap[s.id]?.status ?? "pending";
            const current = edu.currentStepId === s.id && status === "pending";
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-start gap-2 rounded-xl px-2 py-2 text-sm",
                  current ? "bg-sky/15" : "bg-transparent",
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {status === "done" ? (
                    <Check className="size-4 text-secondary" aria-hidden />
                  ) : status === "skipped" ? (
                    <Minus className="size-4 text-ink/50" aria-hidden />
                  ) : (
                    <Circle
                      className={cn(
                        "size-4",
                        current ? "text-primary" : "text-ink/40",
                      )}
                      aria-hidden
                    />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {i + 1}. {t(s.titleKey)}
                  </p>
                  <p className="text-xs text-ink/70">
                    {status === "done"
                      ? t("education.statusDone")
                      : status === "skipped"
                        ? t("education.statusSkipped")
                        : current
                          ? t("education.statusCurrent")
                          : t("education.statusPending")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-col gap-2">
          {edu.menuLabel === "startAgain" ? (
            <Button className="min-h-11 w-full" onClick={edu.startAgain}>
              {t("education.startAgain")}
            </Button>
          ) : (
            <Button className="min-h-11 w-full" onClick={edu.resume}>
              {t("education.resume")}
            </Button>
          )}
          <Button
            variant="secondary"
            className="min-h-11 w-full"
            onClick={edu.closeChecklist}
          >
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
