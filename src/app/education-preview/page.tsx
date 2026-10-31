"use client";

/**
 * Dev/acceptance preview for Education mode sheets (no auth).
 * Query: ?step=properties|calendar|contacts|work|home|settings|finished|chip|checklist
 *        &theme=frost|dark
 */
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EDUCATION_STEP_IDS,
  EDUCATION_STEPS,
  emptyStepsMap,
  type EducationStepId,
} from "@/lib/education/steps";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const VALID = new Set<string>([
  ...EDUCATION_STEP_IDS,
  "finished",
  "chip",
  "checklist",
]);

function PreviewInner() {
  const params = useSearchParams();
  const { t } = useI18n();
  const stepParam = params.get("step") ?? "properties";
  const theme = params.get("theme") === "dark" ? "dark" : "frost";

  useEffect(() => {
    document.documentElement.dataset.appearance =
      theme === "dark" ? "dark" : "frost";
  }, [theme]);

  const stepId = (
    EDUCATION_STEP_IDS.includes(stepParam as EducationStepId)
      ? stepParam
      : "properties"
  ) as EducationStepId;
  const step = EDUCATION_STEPS.find((s) => s.id === stepId)!;
  const stepIndex = EDUCATION_STEP_IDS.indexOf(stepId);
  const stepsMap = useMemo(() => {
    const map = emptyStepsMap();
    for (let i = 0; i < stepIndex; i++) {
      map[EDUCATION_STEP_IDS[i]] = { status: "done", at: new Date().toISOString() };
    }
    return map;
  }, [stepIndex]);

  const mode = VALID.has(stepParam) ? stepParam : "properties";

  if (mode === "finished") {
    return (
      <Shell label="finished">
        <div className="fixed inset-0 z-10 flex items-end justify-center p-3 sm:items-center">
          <div className="absolute inset-0 bg-ink/45" aria-hidden />
          <div className="relative z-10 w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-card p-4 soft-shadow">
            <h2 className="font-display text-lg font-bold text-ink">
              {t("education.youreSetTitle")}
            </h2>
            <p className="mt-1 text-sm text-ink/80">{t("education.youreSetBody")}</p>
            <Button className="mt-4 min-h-11 w-full">{t("education.viewChecklist")}</Button>
            <Button variant="ghost" className="mt-2 min-h-11 w-full">
              {t("common.close")}
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  if (mode === "chip") {
    return (
      <Shell label="chip">
        <FakeAppChrome />
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-3">
          <button
            type="button"
            className="pointer-events-auto flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-card px-4 py-2 text-sm font-semibold text-ink soft-shadow"
          >
            <Check className="size-4 text-secondary" aria-hidden />
            {t("education.chipLabel", { current: 2, total: 6 })}
          </button>
        </div>
      </Shell>
    );
  }

  if (mode === "checklist") {
    const percent = Math.round((2 / 6) * 100);
    return (
      <Shell label="checklist">
        <div className="fixed inset-0 z-10 flex items-end justify-center p-3 sm:items-center">
          <div className="absolute inset-0 bg-ink/45" aria-hidden />
          <div className="relative z-10 w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-card p-4 soft-shadow">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-ink">
                {t("education.checklistTitle")}
              </h2>
              <span className="text-sm font-semibold text-secondary">
                {t("education.percent", { percent })}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {EDUCATION_STEPS.map((s, i) => {
                const st =
                  i < 2 ? "done" : i === 2 ? "current" : "pending";
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-ink">{t(s.titleKey)}</span>
                    <span className="text-xs text-ink/65">
                      {st === "done"
                        ? t("education.statusDone")
                        : st === "current"
                          ? t("education.statusCurrent")
                          : t("education.statusPending")}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Button className="mt-4 min-h-11 w-full">{t("education.resume")}</Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell label={stepId}>
      <FakeAppChrome highlight={step.targets[0]} />
      <div className="pointer-events-none fixed inset-0 z-[15] bg-ink/45" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-6 sm:justify-end sm:pe-6">
        <div className="pointer-events-auto w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-card p-4 soft-shadow">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/65">
            {t("education.stepOf", {
              current: stepIndex + 1,
              total: EDUCATION_STEP_IDS.length,
            })}
          </p>
          <div className="mt-2 flex gap-1.5" aria-hidden>
            {EDUCATION_STEP_IDS.map((id) => {
              const st = stepsMap[id]?.status ?? "pending";
              return (
                <span
                  key={id}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    st === "done"
                      ? "bg-secondary"
                      : id === stepId
                        ? "bg-primary"
                        : "bg-ink/15",
                  )}
                />
              );
            })}
          </div>
          <h2 className="mt-2 font-display text-base font-bold leading-snug text-ink">
            {t(step.titleKey)}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">
            {t(step.bodyKey)}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button className="min-h-11 w-full" size="sm">
              {t(step.ctaKey)}
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="ghost" className="min-h-11" disabled={stepIndex <= 0}>
                {t("common.back")}
              </Button>
              <Button size="sm" variant="secondary" className="min-h-11">
                {t("education.skipStep")}
              </Button>
              <Button size="sm" variant="secondary" className="min-h-11">
                {t("education.pause")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="min-h-dvh bg-sand" data-edu-preview={label}>
      {children}
    </div>
  );
}

function FakeAppChrome({ highlight }: { highlight?: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 pt-8">
      <p className="font-display text-xl font-bold text-ink">Pulse Flow</p>
      <p className="mt-1 text-sm text-ink/70">Home · preview chrome</p>
      <div className="mt-6 space-y-3">
        {["nav-properties", "add-property", "quick-fill", "home-focus", "bottom-nav"].map(
          (id) => (
            <div
              key={id}
              data-tour={id}
              className={cn(
                "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-card px-3 py-4 text-sm text-ink",
                highlight === id && "ring-2 ring-primary ring-offset-2 ring-offset-sand",
              )}
            >
              Target: {id}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default function EducationPreviewPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-dvh bg-sand" />;
  return (
    <Suspense fallback={<div className="min-h-dvh bg-sand" />}>
      <PreviewInner />
    </Suspense>
  );
}
