import { cn } from "@/lib/utils";

/** Screen wrapper — consistent vertical rhythm (8px scale). */
export function Screen({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("pf-screen animate-rise", className)}>{children}</div>;
}

/** L1 title + optional L3 meta + actions. */
export function ScreenHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("pf-screen-header", className)}>
      <div className="min-w-0">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/** 12-column responsive grid. */
export function Grid12({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("pf-grid-12", className)}>{children}</div>;
}

export function Col({
  span = 12,
  className,
  children,
}: {
  span?: 3 | 4 | 6 | 8 | 12;
  className?: string;
  children: React.ReactNode;
}) {
  const spanClass =
    span === 3
      ? "pf-col-3"
      : span === 4
        ? "pf-col-4"
        : span === 6
          ? "pf-col-6"
          : span === 8
            ? "pf-col-8"
            : "pf-col-12";
  return <div className={cn(spanClass, className)}>{children}</div>;
}
