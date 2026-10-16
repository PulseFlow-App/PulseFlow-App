"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActionBusy } from "@/lib/ui/use-action-busy";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  /** Shows spinner and disables the control while work is in flight. */
  busy?: boolean;
  /**
   * Also spin while any tracked app mutation runs.
   * Defaults on for primary/danger so submit actions never look idle.
   */
  reflectGlobalBusy?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  busy = false,
  reflectGlobalBusy,
  disabled,
  children,
  ...props
}: Props) {
  const globalBusy = useActionBusy();
  const trackGlobal =
    reflectGlobalBusy ?? (variant === "primary" || variant === "danger");
  const showBusy = busy || (trackGlobal && globalBusy);

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold transition active:scale-[0.98] disabled:opacity-50",
        size === "xs" && "h-8 gap-1 px-2.5 text-xs",
        size === "sm" && "h-9 px-3 py-1.5 text-sm",
        size === "md" && "h-10 px-4 py-2 text-sm",
        size === "lg" && "h-11 px-5 py-2.5 text-sm",
        variant === "primary" &&
          "bg-primary text-white shadow-[0_8px_20px_rgba(242,106,54,0.28)] hover:bg-primary-dark",
        variant === "primary" &&
          size === "xs" &&
          "shadow-[0_4px_12px_rgba(242,106,54,0.22)]",
        /* Horizon secondary action = sky (not success teal) */
        variant === "secondary" &&
          "bg-sky text-white shadow-[0_8px_18px_rgba(33,158,188,0.28)] hover:brightness-95",
        variant === "ghost" &&
          "border border-[var(--color-border)] bg-card text-ink hover:bg-canvas-deep",
        variant === "danger" && "bg-danger text-white",
        showBusy && "pointer-events-none",
        className,
      )}
      aria-busy={showBusy || undefined}
      disabled={disabled || showBusy}
      {...props}
    >
      {showBusy ? (
        <Loader2
          className={cn(
            "shrink-0 animate-spin",
            size === "xs" ? "size-3.5" : "size-4",
          )}
        />
      ) : null}
      {children}
    </button>
  );
}
