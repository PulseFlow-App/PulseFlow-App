"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant = "danger",
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        aria-label={t("common.close")}
        onClick={onClose}
        disabled={busy}
      />
      <Card
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-desc" : undefined}
        className="relative z-10 w-full max-w-sm space-y-5 p-5 animate-rise sm:rounded-[1.5rem]"
      >
        <div className="space-y-2">
          <h2
            id="confirm-dialog-title"
            className="font-display text-xl font-bold text-ink"
          >
            {title}
          </h2>
          {description ? (
            <p id="confirm-dialog-desc" className="text-sm leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant={confirmVariant}
            className="w-full"
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel ?? t("common.confirm")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onClose}
            disabled={busy}
          >
            {cancelLabel ?? t("common.cancel")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
