"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useActionBusy } from "@/lib/ui/use-action-busy";
import { useI18n } from "@/lib/i18n/provider";

/** Blocks taps and shows a clear stay-put wait while mutations run. */
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
      className="fixed inset-0 z-[100] flex items-center justify-center px-6 pointer-events-auto"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" />
      <div className="relative z-10 flex max-w-xs flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-card px-6 py-5 text-center shadow-xl">
        <Loader2 className="size-7 shrink-0 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-ink">{t("common.saving")}</p>
          <p className="text-xs leading-relaxed text-muted">
            {t("common.pleaseWaitStay")}
          </p>
        </div>
      </div>
    </div>
  );
}
