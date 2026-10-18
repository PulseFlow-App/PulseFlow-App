import { APP_UPDATED_AT, APP_VERSION, formatAppVersion } from "@/lib/app-version";
import { cn } from "@/lib/utils";

export function AppVersionMark({
  className,
  compact = false,
}: {
  className?: string;
  /** Shorter line for tight footers (menu sheet, side nav). */
  compact?: boolean;
}) {
  return (
    <p
      className={cn(
        "text-center text-[10px] font-medium tracking-wide text-muted/70",
        className,
      )}
      title={`Pulse Flow ${formatAppVersion()}`}
    >
      {compact ? (
        <>
          <span className="tabular-nums">v{APP_VERSION}</span>
          <span aria-hidden className="mx-1 opacity-50">
            ·
          </span>
          <span>{APP_UPDATED_AT}</span>
        </>
      ) : (
        formatAppVersion()
      )}
    </p>
  );
}
