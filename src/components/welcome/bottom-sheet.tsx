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
        "fixed inset-0 z-[90] flex justify-center",
        compact
          ? "items-center p-3 sm:p-4"
          : "items-end sm:items-center sm:p-4",
      )}
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex w-full flex-col bg-card",
          "shadow-[0_-8px_40px_rgba(2,48,71,0.18)] animate-rise",
          compact
            ? "max-h-[min(92dvh,34rem)] max-w-sm rounded-2xl pb-3 pt-2"
            : "max-h-[min(88dvh,40rem)] max-w-lg rounded-t-[1.25rem] pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:rounded-[1.25rem]",
        )}
      >
        {!compact ? (
          <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-[var(--color-border)] sm:hidden" />
        ) : null}
        <div
          className={cn(
            "flex items-center justify-between gap-2",
            compact ? "px-3 pb-1" : "px-5 pb-2",
          )}
        >
          <h2
            id={titleId}
            className={cn(
              "font-display font-bold leading-snug text-ink",
              compact ? "text-sm" : "text-lg",
            )}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-full text-ink hover:bg-canvas-deep",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              compact ? "size-7" : "size-11",
            )}
            aria-label={t("welcome.sheetClose")}
          >
            <X className={compact ? "size-3.5" : "size-5"} aria-hidden />
          </button>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            compact ? "px-3 pb-1" : "px-5 pb-4",
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
