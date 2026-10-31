"use client";

import { useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { BottomSheet } from "@/components/welcome/bottom-sheet";
import { LOCALES, LOCALE_META } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function LocalePickerSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <BottomSheet
      open={open}
      title={t("language.title")}
      onClose={onClose}
      compact
    >
      <ul className="space-y-0.5" role="listbox" aria-label={t("language.choose")}>
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
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-start transition",
                  selected
                    ? "bg-sky/20 text-ink ring-1 ring-sky/35"
                    : "text-ink hover:bg-canvas-deep",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                )}
              >
                <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold leading-snug">
                  {meta.native}
                  <span className="ms-1.5 font-sans text-[11px] font-medium text-muted">
                    {meta.label}
                  </span>
                </span>
                {selected ? (
                  <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}

/** Compact header control — opens Horizon bottom sheet (not native select). */
function InlineLanguageButton() {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const native = LOCALE_META[locale].native;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative z-10 inline-flex h-8 max-w-[7rem] items-center gap-1 rounded-full px-2",
          "border border-[var(--color-border)] bg-card text-ink",
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
      <LocalePickerSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function SettingsLanguageButton() {
  const { locale, t, dir } = useI18n();
  const [open, setOpen] = useState(false);
  const meta = LOCALE_META[locale];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-[var(--color-border)] bg-card px-3 py-2 text-ink soft-shadow transition",
          "hover:bg-canvas-deep",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        )}
        aria-label={t("language.choose")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Languages className="size-4 shrink-0 text-ink/65" aria-hidden />
        <span className="min-w-0 flex-1 text-start text-sm font-semibold text-ink">
          {meta.native}
          <span className="ms-1.5 text-xs font-medium text-ink/65">{meta.label}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-ink/65",
            dir === "rtl" && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <LocalePickerSheet open={open} onClose={() => setOpen(false)} />
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
    <div className="space-y-1.5">
      <div>
        <p className="font-display text-base font-bold text-ink">
          {t("settings.language")}
        </p>
        {!hideHint && t("settings.languageHint") ? (
          <p className="text-sm text-ink/70">{t("settings.languageHint")}</p>
        ) : null}
      </div>
      <SettingsLanguageButton />
    </div>
  );
}
