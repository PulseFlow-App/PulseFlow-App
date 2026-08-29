"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data/use-app-data";
import { canCancelServiceOrder } from "@/lib/service-orders";
import { useI18n } from "@/lib/i18n/provider";

export function AgreeButton({
  orderId,
  className,
}: {
  orderId: string;
  className?: string;
}) {
  const data = useData();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const order = data.serviceOrders.find((o) => o.id === orderId);
  if (!order || !data.profile) return null;
  if (order.staff_profile_id !== data.profile.id) return null;
  if (order.status !== "pending_ack") {
    return (
      <p className="text-sm font-semibold text-secondary">
        ✓ {t("jobs.agreed")}
      </p>
    );
  }

  const canDecline = canCancelServiceOrder(
    data.profile,
    order,
    data.orgKind,
  );

  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button
        className="w-full"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError(null);
          void data
            .agreeServiceOrder(orderId)
            .catch((e: unknown) =>
              setError(e instanceof Error ? e.message : t("common.error")),
            )
            .finally(() => setBusy(false));
        }}
      >
        <Check className="size-4" />
        {busy ? t("jobs.saving") : t("jobs.readAgreed")}
      </Button>
      {canDecline ? (
        <Button
          className="w-full"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError(null);
            void data
              .cancelServiceOrder(orderId)
              .catch((e: unknown) =>
                setError(e instanceof Error ? e.message : t("common.error")),
              )
              .finally(() => setBusy(false));
          }}
        >
          {t("jobs.decline")}
        </Button>
      ) : null}
    </div>
  );
}
