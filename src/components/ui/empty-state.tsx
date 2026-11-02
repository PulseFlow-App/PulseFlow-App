export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-pf-card border border-pf-line bg-pf-card px-5 py-10 text-center">
      <p className="text-pf-18 font-medium text-pf-ink">{title}</p>
      {description ? (
        <p className="mt-2 text-pf-16 text-pf-text-secondary">{description}</p>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-pf-16 text-pf-text-secondary">
      <div className="flex items-center gap-2">
        <span className="size-2.5 animate-pulse rounded-full bg-primary" />
        {label}
      </div>
    </div>
  );
}

export function OfflineBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="sticky top-0 z-40 bg-pf-yellow-300 px-4 py-3 text-center text-pf-14 font-medium text-pf-warning-ink">
      You&apos;re offline - changes will sync when you&apos;re back online.
    </div>
  );
}
