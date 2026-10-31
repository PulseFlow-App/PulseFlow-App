"use client";

import { useEffect, useId, useRef } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EducationSpotlight } from "@/components/education/spotlight";
import { useEducation } from "@/lib/education/provider";
import { EDUCATION_STEP_IDS } from "@/lib/education/steps";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function EducationTourSheet() {
  const { t } = useI18n();
  const edu = useEducation();
  const titleId = useId();
  const liveId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const stepIndex = edu.currentStepId
    ? EDUCATION_STEP_IDS.indexOf(edu.currentStepId)
    : -1;
  const stepNum = stepIndex >= 0 ? stepIndex + 1 : 0;
  const total = EDUCATION_STEP_IDS.length;
  const activeTarget =
    edu.step?.targets[edu.targetIndex] ?? edu.step?.targets[0] ?? null;

  useEffect(() => {
    if (edu.uiMode !== "sheet") return;
    const tmr = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("button[data-edu-primary]")
        ?.focus();
    }, 50);
    return () => window.clearTimeout(tmr);
  }, [edu.uiMode, edu.currentStepId]);

  if (!edu.eligible) return null;

  if (edu.uiMode === "finished") {
    return (
      <div className="fixed inset-0 z-[220] flex items-end justify-center p-3 sm:items-center">
        <div className="absolute inset-0 bg-ink/45" aria-hidden />
        <div className="relative z-10 w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-card p-4 soft-shadow">
          <h2 className="font-display text-lg font-bold text-ink">
            {t("education.youreSetTitle")}
          </h2>
          <p className="mt-1 text-sm text-ink/80">{t("education.youreSetBody")}</p>
          <Button
            className="mt-4 min-h-11 w-full"
            onClick={() => edu.openChecklist()}
          >
            {t("education.viewChecklist")}
          </Button>
          <Button
            variant="ghost"
            className="mt-2 min-h-11 w-full"
            onClick={edu.closeChecklist}
          >
            {t("common.close")}
          </Button>
        </div>
      </div>
    );
  }

  if (edu.uiMode === "chip") {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[215] flex justify-center px-3 md:bottom-6">
        <button
          type="button"
          className="pointer-events-auto flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-card px-4 py-2 text-sm font-semibold text-ink soft-shadow"
          onClick={edu.expandSheet}
        >
          {edu.celebrating ? (
            <Check className="size-4 text-secondary" aria-hidden />
          ) : null}
          {t("education.chipLabel", {
            current: stepNum,
            total,
          })}
        </button>
      </div>
    );
  }

  if (edu.uiMode !== "sheet" && edu.uiMode !== "celebrate") return null;
  if (!edu.step) return null;

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <>
      <EducationSpotlight
        tourId={activeTarget}
        active={edu.uiMode === "sheet" || edu.uiMode === "celebrate"}
      />
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[220] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-6 sm:justify-end sm:pe-6"
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          aria-describedby={liveId}
          className="pointer-events-auto w-full max-w-sm animate-rise rounded-[var(--radius-card)] border border-[var(--color-border)] bg-card p-4 soft-shadow"
        >
          <p
            id={liveId}
            className="text-[11px] font-semibold uppercase tracking-wide text-ink/65"
            aria-live="polite"
          >
            {t("education.stepOf", { current: stepNum, total })}
          </p>
          <div className="mt-2 flex gap-1.5" aria-hidden>
            {EDUCATION_STEP_IDS.map((id) => {
              const st = edu.stepsMap[id]?.status ?? "pending";
              return (
                <span
                  key={id}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    st === "done"
                      ? "bg-secondary"
                      : st === "skipped"
                        ? "bg-ink/25"
                        : id === edu.currentStepId
                          ? "bg-primary"
                          : "bg-ink/15",
                  )}
                />
              );
            })}
          </div>
          <h2
            id={titleId}
            className="mt-2 font-display text-base font-bold leading-snug text-ink"
          >
            {t(edu.step.titleKey)}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">
            {t(edu.step.bodyKey)}
          </p>

          {edu.celebrating && !reduceMotion ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-secondary">
              <Check className="size-4" aria-hidden />
              {t("education.stepComplete")}
            </p>
          ) : null}

          <div className="mt-3 flex flex-col gap-2">
            <Button
              data-edu-primary
              className="min-h-11 w-full"
              size="sm"
              onClick={edu.primaryAction}
            >
              {t(edu.step.ctaKey)}
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="min-h-11"
                onClick={edu.back}
                disabled={stepIndex <= 0}
              >
                {t("common.back")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="min-h-11"
                onClick={edu.skip}
              >
                {t("education.skipStep")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="min-h-11"
                onClick={edu.pause}
              >
                {t("education.pause")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
