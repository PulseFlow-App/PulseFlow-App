"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type BottomSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Tighter header / close; centered higher so dense lists fit without scroll. */
  compact?: boolean;
};

export function BottomSheet({
  open,
  title,
  onClose,
  children,
  compact = false,
}: BottomSheetProps) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      trapFocus(e);
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("button, [href], [tabindex]")
        ?.focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose, trapFocus]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[90] flex items-center justify-center p-4",
      )}
    >
      <button
        type="button"
        className="absolute inset-0 bg-pf-navy-900/40"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex w-full max-w-sm flex-col rounded-[28px] bg-pf-card shadow-pf-2 motion-safe:animate-rise",
          compact
            ? "max-h-[min(70dvh,32rem)] pb-3 pt-3"
            : "max-h-[min(70dvh,32rem)] pb-[max(1rem,env(safe-area-inset-bottom))] pt-3",
        )}
      >
        <div className="mx-auto mb-2 h-1 w-9 shrink-0 rounded-full bg-pf-line" />
        <div className="flex items-center justify-between gap-2 px-4 pb-2">
          <h2
            id={titleId}
            className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-pf-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600"
            aria-label={t("welcome.sheetClose")}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            "px-4 pb-4",
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
