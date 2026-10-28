"use client";

import { useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { BottomSheet } from "@/components/welcome/bottom-sheet";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n";
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
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={cn(
          "w-full appearance-none rounded-2xl border border-[var(--color-border)] bg-card py-3 text-sm font-semibold text-ink soft-shadow",
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

/** Compact header control — opens Horizon bottom sheet (not native select). */
function InlineLanguageButton() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const native = LOCALE_META[locale].native;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 max-w-[7.5rem] items-center gap-1 rounded-full px-2.5",
          "border border-[var(--color-border)] bg-card text-ink soft-shadow",
          "hover:bg-canvas-deep",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        )}
        aria-label={t("language.choose")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Languages className="size-3.5 shrink-0 text-muted" aria-hidden />
        <span className="min-w-0 truncate text-xs font-semibold">{native}</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted" aria-hidden />
      </button>
      <BottomSheet
        open={open}
        title={t("language.title")}
        onClose={() => setOpen(false)}
      >
        <ul className="space-y-1.5" role="listbox" aria-label={t("language.choose")}>
          {LOCALES.map((code) => {
            const selected = code === locale;
            const meta = LOCALE_META[code];
            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-start transition",
                    "border border-[var(--color-border)]",
                    selected
                      ? "bg-primary-soft text-ink ring-1 ring-primary/30"
                      : "bg-card text-ink hover:bg-canvas-deep",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm font-bold leading-snug">
                      {meta.native}
                    </span>
                    <span className="block text-xs text-muted">{meta.label}</span>
                  </span>
                  {selected ? (
                    <Check className="size-4 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </>
  );
}

export function LanguageSwitcher({
  variant = "settings",
  hideHint = false,
}: {
  /** `inline` for welcome/login header; `settings` for the settings card. */
  variant?: "inline" | "settings";
  /** Hide the helper line under the Language label (guest profile notes). */
  hideHint?: boolean;
}) {
  const { t } = useI18n();

  if (variant === "inline") {
    return <InlineLanguageButton />;
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-bold text-ink">{t("settings.language")}</p>
        {!hideHint && t("settings.languageHint") ? (
          <p className="text-sm text-muted">{t("settings.languageHint")}</p>
        ) : null}
      </div>
      <LocaleSelect />
    </div>
  );
}
