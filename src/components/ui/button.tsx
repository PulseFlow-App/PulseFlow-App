import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold transition active:scale-[0.98] disabled:opacity-50",
        size === "xs" && "h-8 gap-1 px-2.5 text-xs",
        size === "sm" && "px-3.5 py-2 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-6 py-3.5 text-base",
        variant === "primary" &&
          "bg-gradient-to-r from-primary to-primary-dark text-white shadow-[0_8px_20px_rgba(240,122,58,0.28)]",
        variant === "primary" &&
          size === "xs" &&
          "shadow-[0_4px_12px_rgba(240,122,58,0.22)]",
        variant === "secondary" && "bg-secondary text-white",
        variant === "ghost" &&
          "border border-[var(--color-border)] bg-card text-ink hover:bg-sand-deep",
        variant === "danger" && "bg-danger text-white",
        className,
      )}
      {...props}
    />
  );
}
