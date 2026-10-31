"use client";

import { useAppearance } from "@/lib/appearance/provider";
import {
  APPEARANCE_OPTIONS,
  normalizeAppearance,
  type AppearanceOption,
} from "@/lib/appearance/types";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LABEL_KEYS: Record<AppearanceOption, MessageKey> = {
  frost: "settings.appearanceFrost",
  dark: "settings.appearanceDark",
};

const HINT_KEYS: Record<AppearanceOption, MessageKey> = {
  frost: "settings.appearanceFrostHint",
  dark: "settings.appearanceDarkHint",
};

export function AppearanceSettingsCard() {
  const { t } = useI18n();
  const { appearance, setAppearance } = useAppearance();
  const current = normalizeAppearance(appearance);

  return (
    <div className="space-y-2">
      <div>
        <p className="font-display text-base font-bold text-ink">
          {t("settings.appearance")}
        </p>
        <p className="text-sm text-ink/70">{t("settings.appearanceHint")}</p>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {APPEARANCE_OPTIONS.map((option) => {
          const selected = current === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setAppearance(option)}
              aria-pressed={selected}
              className={cn(
                "rounded-xl border px-3 py-2 text-left transition",
                selected
                  ? "border-sky bg-sky/20 text-ink ring-1 ring-sky/35"
                  : "border-[var(--color-border)] bg-canvas-deep text-ink hover:border-sky/40",
              )}
            >
              <span className="block text-sm font-bold text-ink">
                {t(LABEL_KEYS[option])}
              </span>
              <span className="mt-0.5 block text-xs text-ink/70">
                {t(HINT_KEYS[option])}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
