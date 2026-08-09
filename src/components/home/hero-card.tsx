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
    <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary to-primary-dark px-5 py-6 text-white shadow-[0_16px_36px_rgba(240,122,58,0.32)]">
      <div className="absolute -right-8 -top-10 size-36 rounded-full bg-white/10" />
      <div className="absolute bottom-4 right-6 h-8 w-24 opacity-50">
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
      <p className="text-sm font-medium text-white/85">{t("home.ready")}</p>
      <h1 className="mt-1 font-display text-[1.75rem] font-bold leading-tight">
        {t("home.hello", { name: greetingName(name) })}
      </h1>
      <p className="mt-2 max-w-[90%] text-sm text-white/90">{subtitle}</p>
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-white/90">
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
