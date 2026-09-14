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
    <div className="pf-grid-12 !gap-3 md:!gap-4">
      {order.map((status) => {
        const Icon = meta[status].icon;
        return (
          <Card key={status} className="pf-col-3 p-4 md:p-5">
            <Icon
              className={`size-6 ${meta[status].ink}`}
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="mt-4 font-display text-[1.75rem] font-extrabold leading-none tracking-tight text-ink md:text-3xl">
              {counts[status]}
            </p>
            <p className={`mt-2 text-sm font-semibold ${meta[status].ink}`}>
              {labelVillaStatus(t, status)}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
