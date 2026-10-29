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
    <div className="space-y-3">
      <div>
        <p className="font-display text-base font-bold text-ink">
          {t("settings.appearance")}
        </p>
        <p className="text-sm text-muted">{t("settings.appearanceHint")}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {APPEARANCE_OPTIONS.map((option) => {
          const selected = current === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setAppearance(option)}
              aria-pressed={selected}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition",
                selected
                  ? "border-primary bg-primary text-white ring-1 ring-primary/40"
                  : "border-[var(--color-border)] bg-canvas-deep hover:border-sky/40",
              )}
            >
              <span
                className={cn(
                  "block text-sm font-bold",
                  selected ? "text-white" : "text-ink",
                )}
              >
                {t(LABEL_KEYS[option])}
              </span>
              <span
                className={cn(
                  "mt-0.5 block text-xs",
                  selected ? "text-white/85" : "text-muted",
                )}
              >
                {t(HINT_KEYS[option])}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
