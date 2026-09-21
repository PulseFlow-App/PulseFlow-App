"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useActionBusy } from "@/lib/ui/use-action-busy";
import { useI18n } from "@/lib/i18n/provider";

/** Blocks extra taps and shows a stay-put wait chip while mutations run. */
export function ActionBusyOverlay() {
  const busy = useActionBusy();
  const { t } = useI18n();

  useEffect(() => {
    if (!busy) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [busy]);

  if (!busy) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center pointer-events-auto"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-ink/10 backdrop-blur-[1px]" />
      <div className="relative z-10 mb-[max(6.5rem,calc(5.5rem+env(safe-area-inset-bottom)))] flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-card px-4 py-3 text-sm font-semibold text-ink shadow-lg md:mb-10">
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        <span>{t("common.saving")}</span>
      </div>
    </div>
  );
}
