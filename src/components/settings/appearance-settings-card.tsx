"use client";

import { useAppearance } from "@/lib/appearance/provider";
import { APPEARANCES, type Appearance } from "@/lib/appearance/types";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LABEL_KEYS: Record<Appearance, MessageKey> = {
  horizon: "settings.appearanceHorizon",
  frost: "settings.appearanceFrost",
  dark: "settings.appearanceDark",
};

const HINT_KEYS: Record<Appearance, MessageKey> = {
  horizon: "settings.appearanceHorizonHint",
  frost: "settings.appearanceFrostHint",
  dark: "settings.appearanceDarkHint",
};

export function AppearanceSettingsCard() {
  const { t } = useI18n();
  const { appearance, setAppearance } = useAppearance();

  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-base font-bold text-ink">
          {t("settings.appearance")}
        </p>
        <p className="text-sm text-muted">{t("settings.appearanceHint")}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {APPEARANCES.map((option) => {
          const selected = appearance === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setAppearance(option)}
              aria-pressed={selected}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition",
                selected
                  ? "border-primary bg-primary-soft/60 ring-1 ring-primary/30"
                  : "border-[var(--color-border)] bg-canvas-deep hover:border-sky/40",
              )}
            >
              <span className="block text-sm font-bold text-ink">
                {t(LABEL_KEYS[option])}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {t(HINT_KEYS[option])}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
