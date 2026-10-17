"use client";

import { type VillaStatus } from "@/lib/design-tokens";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { labelVillaStatus } from "@/lib/i18n/labels";
import {
  PulseIcon,
  type PulseIconName,
} from "@/components/icons/pulse-icon";

const meta: Record<
  VillaStatus,
  { icon: PulseIconName; ink: string }
> = {
  occupied: {
    icon: "occupied",
    ink: "text-primary-dark",
  },
  available: {
    icon: "available",
    ink: "text-secondary-dark",
  },
  turnover: {
    icon: "turnover",
    ink: "text-warning-dark",
  },
  maintenance: {
    icon: "maintenance",
    ink: "text-danger-dark",
  },
};

export function StatGrid({
  counts,
}: {
  counts: Record<VillaStatus, number>;
}) {
  const { t } = useI18n();
  const order: VillaStatus[] = [
    "occupied",
    "available",
    "turnover",
    "maintenance",
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-3 md:gap-4">
      {order.map((status) => {
        const label = labelVillaStatus(t, status);
        return (
          <Card
            key={status}
            className="flex flex-col items-center px-1.5 py-2 text-center md:items-start md:p-5 md:text-left"
            title={label}
          >
            <PulseIcon
              name={meta[status].icon}
              className="size-4 md:size-5"
              aria-hidden
            />
            <p className="mt-1 font-display text-lg font-bold leading-none tracking-tight text-ink md:mt-4 md:text-3xl">
              {counts[status]}
            </p>
            <p
              className={`mt-0.5 w-full truncate text-[0.625rem] font-semibold leading-tight md:mt-2 md:text-sm ${meta[status].ink}`}
            >
              {label}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
