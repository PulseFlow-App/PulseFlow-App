"use client";

import { ChevronDown } from "lucide-react";
import { LOCALES, LOCALE_META } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function LocaleSelect({
  className,
  selectClassName,
}: {
  className?: string;
  selectClassName?: string;
}) {
  const { locale, setLocale, t, dir } = useI18n();

  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{t("language.choose")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        className={cn(
          "w-full appearance-none rounded-2xl bg-white py-3 text-sm font-semibold text-ink soft-shadow",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          dir === "rtl" ? "pl-10 pr-4 text-right" : "pl-4 pr-10 text-left",
          selectClassName,
        )}
        aria-label={t("language.choose")}
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_META[code].native}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted",
          dir === "rtl" ? "left-3" : "right-3",
        )}
        aria-hidden
      />
    </label>
  );
}

export function LanguageSwitcher({
  variant = "settings",
}: {
  /** `inline` for login/register header; `settings` for the settings card. */
  variant?: "inline" | "settings";
}) {
  const { t } = useI18n();

  if (variant === "inline") {
    return (
      <LocaleSelect
        className="inline-block min-w-[9.5rem]"
        selectClassName="rounded-full py-2"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-bold text-ink">{t("settings.language")}</p>
        <p className="text-sm text-muted">{t("settings.languageHint")}</p>
      </div>
      <LocaleSelect />
    </div>
  );
}
