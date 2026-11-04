"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Languages } from "lucide-react";
import { selectionTick } from "@/components/pros/haptics";
import { BottomSheet } from "@/components/welcome/bottom-sheet";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { isMarketplaceHost, isServicesLocale, servicesPath } from "@/lib/pros/paths";
import { cn } from "@/lib/utils";

function LocalePickerSheet({
  open,
  onClose,
  locales = LOCALES,
}: {
  open: boolean;
  onClose: () => void;
  locales?: readonly Locale[];
}) {
  const { locale, setLocale, t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  function choose(code: Locale) {
    selectionTick();
    setLocale(code);
    if (typeof window !== "undefined" && isMarketplaceHost(window.location.host)) {
      const visible = pathname.startsWith("/pros")
        ? pathname.slice("/pros".length) || "/"
        : pathname;
      const first = visible.split("/").filter(Boolean)[0] ?? "";
      if (visible === "/" || isServicesLocale(first)) {
        router.push(servicesPath(pathname, `/${code}`));
      }
    }
    onClose();
  }

  return (
    <BottomSheet
      open={open}
      title={t("language.title")}
      onClose={onClose}
      compact
    >
      <ul className="space-y-0.5" role="listbox" aria-label={t("language.choose")}>
        {locales.map((code) => {
          const selected = code === locale;
          const meta = LOCALE_META[code];
          return (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(code)}
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
function InlineLanguageButton({ locales }: { locales?: readonly Locale[] }) {
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
      <LocalePickerSheet open={open} onClose={() => setOpen(false)} locales={locales} />
    </>
  );
}

function SettingsLanguageButton({ locales }: { locales?: readonly Locale[] }) {
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
      <LocalePickerSheet open={open} onClose={() => setOpen(false)} locales={locales} />
    </>
  );
}

function CodeLanguageButton({ locales }: { locales?: readonly Locale[] }) {
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
      <LocalePickerSheet open={open} onClose={() => setOpen(false)} locales={locales} />
    </>
  );
}

export function LanguageSwitcher({
  variant = "settings",
  hideHint = false,
  locales,
}: {
  /** `inline` for welcome/login header; `code` for the services home; `settings` for the settings card. */
  variant?: "inline" | "code" | "settings";
  /** Hide the helper line under the Language label (guest profile notes). */
  hideHint?: boolean;
  /** Limit the list. Maintenance staff stay on English and Thai. */
  locales?: readonly Locale[];
}) {
  const { t } = useI18n();

  if (variant === "inline") {
    return <InlineLanguageButton locales={locales} />;
  }

  if (variant === "code") {
    return <CodeLanguageButton locales={locales} />;
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
      <SettingsLanguageButton locales={locales} />
    </div>
  );
}
