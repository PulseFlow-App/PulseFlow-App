"use client";

import {
  BedDouble,
  Sparkles,
  Wrench,
  CircleCheck,
} from "lucide-react";
import { type VillaStatus } from "@/lib/design-tokens";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";
import { labelVillaStatus } from "@/lib/i18n/labels";

const meta: Record<
  VillaStatus,
  { icon: typeof BedDouble; ink: string }
> = {
  occupied: {
    icon: BedDouble,
    ink: "text-primary-dark",
  },
  available: {
    icon: CircleCheck,
    ink: "text-secondary-dark",
  },
  turnover: {
    icon: Sparkles,
    ink: "text-warning-dark",
  },
  maintenance: {
    icon: Wrench,
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
        const Icon = meta[status].icon;
        const label = labelVillaStatus(t, status);
        return (
          <Card
            key={status}
            className="flex flex-col items-center px-1.5 py-2 text-center md:items-start md:p-5 md:text-left"
            title={label}
          >
            <Icon
              className={`size-4 md:size-5 ${meta[status].ink}`}
              strokeWidth={1.85}
              aria-hidden
            />
            <p className="mt-1 font-display text-lg font-extrabold leading-none tracking-tight text-ink md:mt-4 md:text-3xl">
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
