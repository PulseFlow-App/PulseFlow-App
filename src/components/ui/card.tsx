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
        "rounded-pf-card border border-pf-line bg-pf-card text-pf-ink",
        elevated ? "shadow-pf-1" : "",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
