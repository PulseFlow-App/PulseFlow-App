"use client";

import { greetingName } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function HeroCard({
  name,
  attentionCount,
  attentionLabel,
}: {
  name: string;
  attentionCount: number;
  attentionLabel?: string;
}) {
  const { t } = useI18n();
  const progress = Math.min(100, Math.max(12, 100 - attentionCount * 18));
  const subtitle =
    attentionLabel ??
    (attentionCount === 0
      ? t("home.allSteady")
      : t("home.attention", { count: attentionCount }));

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-primary to-primary-dark px-4 py-4 text-white shadow-[0_16px_36px_rgba(240,122,58,0.32)] md:px-6 md:py-7">
      {/* Soft bubble wash — keep on phone; this is the welcome signature */}
      <div
        className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/15 blur-[1px] md:size-44"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-2 top-8 size-24 rounded-full bg-white/10 md:size-28"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 left-1/3 size-28 rounded-full bg-primary-dark/35 md:size-32"
        aria-hidden
      />
      <div className="pointer-events-none absolute bottom-3 right-4 h-7 w-20 opacity-45 md:bottom-4 md:right-6 md:h-8 md:w-24">
        <svg viewBox="0 0 120 32" className="h-full w-full" fill="none" aria-hidden>
          <path
            d="M0 18h20l6-10 10 22 7-12h77"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="relative text-[11px] font-semibold tracking-wide text-white/85 md:text-sm md:font-medium">
        {t("home.ready")}
      </p>
      <h1 className="relative mt-1 font-display text-[1.35rem] font-extrabold leading-tight tracking-tight md:mt-2 md:text-[clamp(1.5rem,1.2rem+1.2vw,1.875rem)]">
        {t("home.hello", { name: greetingName(name) })}
      </h1>
      <p className="relative mt-1 max-w-[36rem] text-sm text-white/90 md:mt-2 md:text-[0.9375rem]">
        {subtitle}
      </p>
      <div className="relative mt-3 md:mt-5">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-white/90 md:mb-2 md:text-xs">
          <span>{t("home.opsReadiness")}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/25 md:h-2">
          <div
            className="h-full rounded-full bg-white transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}
