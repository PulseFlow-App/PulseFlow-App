export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-[1.5rem] bg-card px-5 py-12 text-center soft-shadow">
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-muted">{description}</p>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
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
    <div className="sticky top-0 z-40 rounded-b-2xl bg-warning px-4 py-2 text-center text-xs font-semibold text-white">
      You&apos;re offline - changes will sync when you&apos;re back online.
    </div>
  );
}
