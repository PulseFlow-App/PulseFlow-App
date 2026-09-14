import { PulseMark } from "@/components/brand/pulse-mark";
import { cn } from "@/lib/utils";

/** Mark + product name — mark stays visible (no clip / no shrink). */
export function PulseWordmark({
  name,
  className,
  markClassName,
  textClassName,
}: {
  name: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 overflow-visible sm:gap-2.5",
        className,
      )}
    >
      <PulseMark
        className={cn(
          "pointer-events-none block size-10 shrink-0 grow-0 rounded-[0.75rem]",
          markClassName,
        )}
      />
      <span
        className={cn(
          "min-w-0 truncate font-display text-[1.2rem] font-extrabold leading-none tracking-tight text-ink",
          textClassName,
        )}
      >
        {name}
      </span>
    </span>
  );
}
