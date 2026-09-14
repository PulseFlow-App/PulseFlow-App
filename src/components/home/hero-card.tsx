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
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-primary to-primary-dark px-4 py-4 text-white lift-shadow md:px-6 md:py-7">
      <div className="absolute -right-8 -top-10 hidden size-36 rounded-full bg-white/10 md:block" />
      <div className="absolute bottom-3 right-4 hidden h-7 w-20 opacity-40 md:block">
        <svg viewBox="0 0 120 32" className="h-full w-full" fill="none">
          <path
            d="M0 18h20l6-10 10 22 7-12h77"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-[11px] font-semibold tracking-wide text-white/80 md:text-xs">
        {t("home.ready")}
      </p>
      <h1 className="mt-1 font-display text-[1.35rem] font-extrabold leading-tight tracking-tight md:mt-2 md:text-[clamp(1.5rem,1.2rem+1.2vw,1.875rem)]">
        {t("home.hello", { name: greetingName(name) })}
      </h1>
      <p className="mt-1 max-w-[36rem] text-sm text-white/90 md:mt-2 md:text-[0.9375rem]">
        {subtitle}
      </p>
      <div className="mt-3 md:mt-5">
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
