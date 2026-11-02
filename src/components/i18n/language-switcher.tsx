"use client";

import { useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { selectionTick } from "@/components/pros/haptics";
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
                  selectionTick();
                  setLocale(code);
                  onClose();
                }}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2 px-3 text-start",
                  selected ? "pf-choice-selected" : "pf-choice",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600",
                )}
              >
                <span className="min-w-0 flex-1 truncate text-pf-16 font-medium leading-snug text-pf-ink">
                  {meta.native}
                  <span className="ms-1.5 text-pf-12 font-medium text-pf-slate-ink">
                    {meta.label}
                  </span>
                </span>
                {selected ? (
                  <Check className="size-4 shrink-0 text-pf-orange-500" aria-hidden />
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
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative z-10 inline-flex size-11 shrink-0 items-center justify-center rounded-full",
          "border border-pf-line bg-pf-card text-pf-ink",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600",
        )}
        aria-label={t("language.choose")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Languages className="size-4 shrink-0 text-pf-text-secondary" aria-hidden />
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
          "flex min-h-11 w-full items-center gap-2 rounded-[14px] border border-pf-line bg-pf-card px-3 text-pf-ink",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600",
        )}
        aria-label={t("language.choose")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Languages className="size-4 shrink-0 text-pf-text-secondary" aria-hidden />
        <span className="min-w-0 flex-1 text-start text-pf-16 font-medium text-pf-ink">
          {meta.native}
          <span className="ms-1.5 text-pf-12 font-medium text-pf-slate-ink">{meta.label}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-pf-slate-ink",
            dir === "rtl" && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <LocalePickerSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CodeLanguageButton() {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 min-w-11 items-center justify-center rounded-full bg-pf-card px-3 font-[family-name:var(--font-pf-chrome)] text-pf-14 font-medium text-pf-ink shadow-pf-1 ring-1 ring-pf-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600"
        aria-label={t("language.choose")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {locale.toUpperCase()}
      </button>
      <LocalePickerSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function LanguageSwitcher({
  variant = "settings",
  hideHint = false,
}: {
  /** `inline` for welcome/login header; `code` for the services home; `settings` for the settings card. */
  variant?: "inline" | "code" | "settings";
  /** Hide the helper line under the Language label (guest profile notes). */
  hideHint?: boolean;
}) {
  const { t } = useI18n();

  if (variant === "inline") {
    return <InlineLanguageButton />;
  }

  if (variant === "code") {
    return <CodeLanguageButton />;
  }

  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-pf-16 font-medium text-pf-ink">
          {t("settings.language")}
        </p>
        {!hideHint && t("settings.languageHint") ? (
          <p className="text-pf-14 text-pf-slate-ink">{t("settings.languageHint")}</p>
        ) : null}
      </div>
      <SettingsLanguageButton />
    </div>
  );
}
