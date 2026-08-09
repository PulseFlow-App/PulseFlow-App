"use client";

import { LOCALES, LOCALE_META } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useI18n();

  if (compact) {
    return (
      <label className="flex items-center gap-2 text-sm">
        <span className="sr-only">{t("language.choose")}</span>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as typeof locale)}
          className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-ink soft-shadow"
          aria-label={t("language.choose")}
        >
          {LOCALES.map((code) => (
            <option key={code} value={code}>
              {LOCALE_META[code].native}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-bold text-ink">{t("settings.language")}</p>
        <p className="text-sm text-muted">{t("settings.languageHint")}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {LOCALES.map((code) => {
          const active = locale === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={cn(
                "rounded-2xl px-2 py-3 text-center transition",
                active
                  ? "bg-gradient-to-br from-primary to-primary-dark text-white"
                  : "bg-white text-ink soft-shadow",
              )}
            >
              <span className="block text-sm font-bold leading-tight">
                {LOCALE_META[code].native}
              </span>
              <span
                className={cn(
                  "mt-0.5 block text-[10px] font-semibold uppercase tracking-wide",
                  active ? "text-white/80" : "text-muted",
                )}
              >
                {LOCALE_META[code].label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
