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
        "inline-flex items-center justify-center gap-2 rounded-pf-pill font-medium motion-reduce:transform-none active:scale-[0.98] disabled:opacity-50",
        size === "xs" && "h-8 gap-1 px-2.5 text-pf-12",
        size === "sm" && "min-h-11 px-3 text-pf-14",
        size === "md" && "min-h-11 px-4 text-pf-16",
        size === "lg" && "min-h-11 px-5 text-pf-16",
        variant === "primary" &&
          "bg-pf-orange-500 text-white active:bg-pf-orange-700",
        variant === "secondary" &&
          "border border-pf-line bg-pf-card text-pf-ink",
        variant === "ghost" &&
          "border border-pf-line bg-pf-card text-pf-ink",
        variant === "danger" && "bg-pf-danger text-pf-navy-900",
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
