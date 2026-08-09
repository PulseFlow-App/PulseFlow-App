"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarsDisplay({
  value,
  size = "md",
  showValue = false,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}) {
  const dim =
    size === "sm" ? "size-3.5" : size === "lg" ? "size-6" : "size-4.5";
  const full = Math.round(value * 2) / 2;

  return (
    <div className="inline-flex items-center gap-1 font-sans">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i + 1 <= Math.floor(full);
        const half = !filled && i + 0.5 === full;
        return (
          <Star
            key={i}
            className={cn(
              dim,
              filled || half
                ? "fill-primary text-primary"
                : "fill-transparent text-[#E5D9CF]",
            )}
            strokeWidth={1.75}
          />
        );
      })}
      {showValue ? (
        <span className="ml-1 text-sm font-bold text-ink">
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
    <div className="flex items-center gap-1">
      {([1, 2, 3, 4, 5] as const).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} stars`}
          onClick={() => onChange(n)}
          className="rounded-full p-1 transition hover:scale-110"
        >
          <Star
            className={cn(
              "size-8",
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
