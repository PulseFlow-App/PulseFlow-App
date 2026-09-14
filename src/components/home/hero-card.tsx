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
    <section className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-primary to-primary-dark px-3.5 py-3 text-white lift-shadow md:px-6 md:py-7">
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
      <p className="text-[10px] font-semibold tracking-wide text-white/80 md:text-xs">
        {t("home.ready")}
      </p>
      <h1 className="mt-0.5 font-display text-[1.2rem] font-extrabold leading-tight tracking-tight md:mt-2 md:text-[clamp(1.5rem,1.2rem+1.2vw,1.875rem)]">
        {t("home.hello", { name: greetingName(name) })}
      </h1>
      <p className="mt-0.5 line-clamp-2 max-w-[36rem] text-[0.8125rem] leading-snug text-white/90 md:mt-2 md:line-clamp-none md:text-[0.9375rem]">
        {subtitle}
      </p>
      <div className="mt-2.5 hidden md:mt-5 md:block">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white/90">
          <span>{t("home.opsReadiness")}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}
