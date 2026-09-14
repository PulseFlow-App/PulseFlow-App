import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  elevated = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { elevated?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-card text-ink",
        elevated ? "lift-shadow" : "soft-shadow",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
