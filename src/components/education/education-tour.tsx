"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { PulseIcon } from "@/components/icons/pulse-icon";
import { useEducation } from "@/lib/education/provider";
import { useI18n } from "@/lib/i18n/provider";

export function EducationTour() {
  const { t } = useI18n();
  const { open, step, steps, index, next, back, skipAll } = useEducation();
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skipAll();
      }
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("button[data-edu-primary]")
        ?.focus();
    }, 0);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, skipAll, index]);

  if (!mounted || !open || !step || steps.length === 0) return null;

  const last = index >= steps.length - 1;
  const progress = t("education.progress", {
    current: index + 1,
    total: steps.length,
  });

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-sm animate-rise rounded-[var(--radius-card)] border border-[var(--color-border)] bg-card p-4 soft-shadow sm:p-5"
      >
        <div className="mb-3 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky/20">
            <PulseIcon name={step.icon} className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/65">
              {t("education.mode")} · {progress}
            </p>
            <h2
              id={titleId}
              className="mt-0.5 font-display text-lg font-bold leading-snug text-ink"
            >
              {t(step.titleKey)}
            </h2>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-ink/80">{t(step.bodyKey)}</p>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            data-edu-primary
            className="w-full"
            size="sm"
            onClick={next}
          >
            {last ? t("education.finish") : t("education.next")}
          </Button>
          <div className="flex gap-2">
            {index > 0 ? (
              <Button
                size="sm"
                variant="ghost"
                className="flex-1"
                onClick={back}
              >
                {t("common.back")}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={skipAll}
            >
              {t("education.skip")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
