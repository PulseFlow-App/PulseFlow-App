"use client";

import { Moon, Sun } from "lucide-react";
import { useAppearance } from "@/lib/appearance/provider";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * Compact header control on the public welcome (no login).
 * Cycles frost (white liquid glass) → dark → frost. First click from Horizon
 * enters frost so the landing immediately shows the sky glass look.
 */
export function ThemeIconToggle({ className }: { className?: string }) {
  const { appearance, setAppearance } = useAppearance();
  const { t } = useI18n();
  const isDark = appearance === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        // Horizon → frost (white glass) → dark → frost …
        if (appearance === "dark") setAppearance("frost");
        else if (appearance === "frost") setAppearance("dark");
        else setAppearance("frost");
      }}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full",
        "border border-[var(--color-border)] bg-card text-ink soft-shadow",
        "hover:bg-canvas-deep",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
      aria-label={isDark ? t("welcome.themeFrost") : t("welcome.themeDark")}
      title={t("welcome.themeToggle")}
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </button>
  );
}
