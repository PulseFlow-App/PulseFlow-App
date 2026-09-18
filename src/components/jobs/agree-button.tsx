"use client";

import { useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data/use-app-data";
import {
  canAgreeServiceOrder,
  canCancelServiceOrder,
  canRevokeServiceOrderAgreement,
  canUseJobUiCancel,
} from "@/lib/service-orders";
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

  const canAgree = canAgreeServiceOrder(data.profile, order);
  const canRevoke = canRevokeServiceOrderAgreement(data.profile, order);
  const canDecline = canCancelServiceOrder(
    data.profile,
    order,
    data.orgKind,
  );

  if (order.status === "agreed" && order.staff_profile_id === data.profile.id) {
    return (
      <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
        <p className="text-sm font-semibold text-secondary">
          ✓ {t("jobs.agreed")}
        </p>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {canRevoke ? (
          <Button
            className="w-full"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError(null);
              void data
                .revokeServiceOrderAgreement(orderId)
                .catch((e: unknown) =>
                  setError(e instanceof Error ? e.message : t("common.error")),
                )
                .finally(() => setBusy(false));
            }}
          >
            <Undo2 className="size-4" />
            {busy ? t("jobs.saving") : t("jobs.cancelAgreement")}
          </Button>
        ) : !canUseJobUiCancel(order) ? (
          <p className="text-xs text-muted">{t("jobs.cancelViaChat")}</p>
        ) : null}
      </div>
    );
  }

  if (!canAgree) return null;

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
      {canDecline && order.staff_profile_id === data.profile.id ? (
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
