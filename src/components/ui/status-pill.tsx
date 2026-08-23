"use client";

import { statusColors, type VillaStatus } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { labelVillaStatus } from "@/lib/i18n/labels";

export function StatusPill({
  status,
  className,
}: {
  status: VillaStatus;
  className?: string;
}) {
  const { t } = useI18n();
  const tone = statusColors[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        className,
      )}
      style={{ backgroundColor: tone.soft, color: tone.fg }}
    >
      {labelVillaStatus(t, status)}
    </span>
  );
}
