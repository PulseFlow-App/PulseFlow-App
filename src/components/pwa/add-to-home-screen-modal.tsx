"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

function storageKey() {
  try {
    return `pulseflow.addToHome.dismissed.v1.${window.location.host}`;
  } catch {
    return "pulseflow.addToHome.dismissed.v1";
  }
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return true;
  const media = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const iosStandalone =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return Boolean(media || iosStandalone);
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(storageKey()) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    window.localStorage.setItem(storageKey(), "1");
  } catch {
    /* ignore quota / private mode */
  }
}

type StepRowProps = {
  label: string;
  steps: string[];
  icon: "ios" | "android";
};

function StepRow({ label, steps, icon }: StepRowProps) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-pf-12 font-bold uppercase tracking-[0.04em] text-pf-ink">
        <span className="inline-flex size-5 items-center justify-center text-pf-orange-500" aria-hidden>
          {icon === "ios" ? (
            <svg viewBox="0 0 24 24" className="size-4" focusable="false">
              <path
                fill="currentColor"
                d="M16.5 2.5c-.7.1-1.6.6-2.1 1.2-.5.6-.9 1.5-.8 2.3.8.1 1.6-.4 2.2-1 .5-.6.9-1.5.7-2.5zM19.2 8.2c-1.1-.1-2.1.6-2.7.6-.6 0-1.5-.6-2.5-.6-1.3 0-2.5.7-3.1 1.9-1.4 2.3-.3 5.8 1 7.7.6.9 1.4 2 2.4 1.9.9 0 1.3-.6 2.4-.6s1.4.6 2.4.6c1 0 1.7-1 2.3-1.9.7-1 1-2 1-2.1-.1 0-1.8-.7-1.8-2.8 0-1.7 1.4-2.6 1.5-2.7-.8-1.2-2.1-1.3-2.5-1.3z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-4" focusable="false">
              <path
                fill="currentColor"
                d="M17.6 9.5c-.2-.7-1-1.2-1.8-1.2h-.3l.7-1.3c.1-.2 0-.4-.2-.5s-.4 0-.5.2l-.8 1.4H9.3L8.5 6.7c-.1-.2-.3-.3-.5-.2s-.3.3-.2.5l.7 1.3h-.3c-.8 0-1.6.5-1.8 1.2L5 15.2c0 .1 0 .2.1.3l1.2 1.2c.2.2.5.2.7 0l.9-1h7.2l.9 1c.2.2.5.2.7 0l1.2-1.2c.1-.1.1-.2.1-.3l-1.4-5.7zM9.2 13.2a.9.9 0 110-1.8.9.9 0 010 1.8zm5.6 0a.9.9 0 110-1.8.9.9 0 010 1.8z"
              />
            </svg>
          )}
        </span>
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((step, index) => (
          <span key={`${label}-${step}`} className="contents">
            {index > 0 ? (
              <svg
                viewBox="0 0 16 16"
                className="size-3.5 shrink-0 text-pf-slate-ink opacity-70"
                aria-hidden
                focusable="false"
              >
                <path
                  fill="currentColor"
                  d="M6.2 3.2a.75.75 0 011.06 0l4 4a.75.75 0 010 1.06l-4 4A.75.75 0 019.14 13.2L12.3 10 9.14 6.86a.75.75 0 010-1.06z"
                />
              </svg>
            ) : null}
            <span className="inline-flex min-h-7 items-center rounded-pf-pill border border-pf-line bg-pf-page px-2.5 text-pf-12 font-medium text-pf-ink">
              {step}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** First-visit tip on pre-auth screens. Hidden once dismissed or when already installed. */
export function AddToHomeScreenModal() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isStandaloneDisplay() || wasDismissed()) return;
    const timer = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      rememberDismissed();
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dismiss = () => {
    rememberDismissed();
    setOpen(false);
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-4">
      <button
        type="button"
        className="absolute inset-0 bg-pf-ink/40 backdrop-blur-[2px]"
        aria-label={t("common.close")}
        onClick={dismiss}
      />
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-home-title"
        aria-describedby="add-home-desc"
        className="relative z-10 w-full max-w-md space-y-4 p-5 animate-rise sm:rounded-[1.5rem]"
      >
        <div className="space-y-2">
          <h2
            id="add-home-title"
            className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink"
          >
            {t("pwa.addToHomeTitle")}
          </h2>
          <p id="add-home-desc" className="text-pf-14 leading-relaxed text-pf-text-secondary">
            {t("pwa.addToHomeLead")}
          </p>
        </div>

        <div className="space-y-4 rounded-[20px] border border-pf-line bg-pf-page/80 p-3.5">
          <StepRow
            icon="ios"
            label={t("pwa.iosLabel")}
            steps={[t("pwa.iosStep1"), t("pwa.iosStep2"), t("pwa.iosStep3")]}
          />
          <StepRow
            icon="android"
            label={t("pwa.androidLabel")}
            steps={[t("pwa.androidStep1"), t("pwa.androidStep2"), t("pwa.androidStep3")]}
          />
          <p className="border-t border-pf-line pt-3 text-pf-12 font-medium text-pf-slate-ink">
            {t("pwa.storesLater")}
          </p>
        </div>

        <Button type="button" className="w-full min-h-12" onClick={dismiss} reflectGlobalBusy={false}>
          {t("pwa.addToHomeGotIt")}
        </Button>
      </Card>
    </div>,
    document.body,
  );
}
