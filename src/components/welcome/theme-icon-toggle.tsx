"use client";

import { Moon, Sun } from "lucide-react";
import { useAppearance } from "@/lib/appearance/provider";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** Compact header control on the public welcome (no login). Frost ↔ Dark. */
export function ThemeIconToggle({ className }: { className?: string }) {
  const { appearance, setAppearance } = useAppearance();
  const { t } = useI18n();
  const isDark = appearance === "dark";

  return (
    <button
      type="button"
      onClick={() => setAppearance(isDark ? "frost" : "dark")}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-pf-pill",
        "border border-pf-line bg-pf-card text-pf-ink",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600",
        className,
      )}
      aria-label={isDark ? t("welcome.themeFrost") : t("welcome.themeDark")}
      title={t("welcome.themeToggle")}
    >
      {isDark ? (
        <Sun className="size-3.5" aria-hidden strokeWidth={2} />
      ) : (
        <Moon className="size-3.5" aria-hidden strokeWidth={2} />
      )}
    </button>
  );
}
