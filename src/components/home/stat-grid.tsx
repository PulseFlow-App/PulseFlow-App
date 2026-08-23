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
  { icon: typeof BedDouble; soft: string; ink: string }
> = {
  occupied: {
    icon: BedDouble,
    soft: "bg-primary-soft text-primary-dark",
    ink: "text-primary-dark",
  },
  available: {
    icon: CircleCheck,
    soft: "bg-secondary-soft text-secondary-dark",
    ink: "text-secondary-dark",
  },
  turnover: {
    icon: Sparkles,
    soft: "bg-[#FFF0D6] text-warning-dark",
    ink: "text-warning-dark",
  },
  maintenance: {
    icon: Wrench,
    soft: "bg-[#FDE4E1] text-danger-dark",
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
    <div className="grid grid-cols-2 gap-3">
      {order.map((status) => {
        const Icon = meta[status].icon;
        return (
          <Card key={status} className="p-4">
            <div
              className={`flex size-10 items-center justify-center rounded-full ${meta[status].soft}`}
            >
              <Icon className="size-5" />
            </div>
            <p className="mt-4 font-display text-3xl font-bold text-ink">
              {counts[status]}
            </p>
            <p className={`text-sm font-semibold ${meta[status].ink}`}>
              {labelVillaStatus(t, status)}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
