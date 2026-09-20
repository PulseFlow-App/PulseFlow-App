"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarsDisplay({
  value,
  size = "md",
  showValue = false,
  tone = "default",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  /** Use on dark / gradient cards so stars stay readable and sized. */
  tone?: "default" | "onDark";
}) {
  const dim =
    size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-4";
  const full = Math.round(value * 2) / 2;
  const filledClass =
    tone === "onDark"
      ? "fill-white text-white"
      : "fill-primary text-primary";
  const emptyClass =
    tone === "onDark"
      ? "fill-transparent text-white/35"
      : "fill-transparent text-[#E5D9CF]";

  return (
    <div className="inline-flex max-w-full flex-wrap items-center gap-0.5 font-sans">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i + 1 <= Math.floor(full);
        const half = !filled && i + 0.5 === full;
        return (
          <Star
            key={i}
            className={cn(
              dim,
              "shrink-0",
              filled || half ? filledClass : emptyClass,
            )}
            strokeWidth={1.75}
          />
        );
      })}
      {showValue ? (
        <span
          className={cn(
            "ml-1 text-sm font-bold",
            tone === "onDark" ? "text-white" : "text-ink",
          )}
        >
          {value > 0 ? value.toFixed(1) : "-"}
        </span>
      ) : null}
    </div>
  );
}

export function StarsPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (stars: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <div className="flex max-w-full flex-wrap items-center gap-0.5">
      {([1, 2, 3, 4, 5] as const).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} stars`}
          onClick={() => onChange(n)}
          className="rounded-full p-1 transition hover:scale-105"
        >
          <Star
            className={cn(
              "size-7 shrink-0 sm:size-8",
              n <= value
                ? "fill-primary text-primary"
                : "fill-transparent text-[#E5D9CF]",
            )}
            strokeWidth={1.75}
          />
        </button>
      ))}
    </div>
  );
}
