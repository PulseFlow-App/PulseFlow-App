import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] bg-card text-ink soft-shadow",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
