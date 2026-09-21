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
import { cn } from "@/lib/utils";

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
  const isCreator = order.ordered_by === data.profile.id;
  const isAssignee = order.staff_profile_id === data.profile.id;
  const agreedByName = order.staff_profile_id
    ? data.profiles.find((p) => p.id === order.staff_profile_id)?.full_name ??
      data.contacts.find((c) => c.linked_profile_id === order.staff_profile_id)
        ?.name ??
      null
    : null;

  if (order.status === "agreed" && isAssignee) {
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
            busy={busy}
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
            {!busy ? <Undo2 className="size-4" /> : null}
            {busy ? t("jobs.saving") : t("jobs.cancelAgreement")}
          </Button>
        ) : !canUseJobUiCancel(order) ? (
          <p className="text-xs text-muted">{t("jobs.cancelViaChat")}</p>
        ) : null}
      </div>
    );
  }

  // Creator (or other non-assignee viewers): bright confirmation after they agree.
  if (order.status === "agreed" && agreedByName) {
    return (
      <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
        <div
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] px-4 py-2.5 text-sm font-semibold",
            "bg-primary text-white",
          )}
        >
          <Check className="size-4 shrink-0" />
          {t("jobs.agreedBy", { name: agreedByName })}
        </div>
      </div>
    );
  }

  if (order.status === "pending_ack" && canAgree) {
    return (
      <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button
          className="w-full"
          busy={busy}
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
          {!busy ? <Check className="size-4" /> : null}
          {busy ? t("jobs.saving") : t("jobs.readAgreedAsk")}
        </Button>
        {canDecline && order.staff_profile_id === data.profile.id ? (
          <Button
            className="w-full"
            variant="ghost"
            busy={busy}
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
            {busy ? t("jobs.saving") : t("jobs.decline")}
          </Button>
        ) : null}
      </div>
    );
  }

  // Creator waiting for staff to agree — muted, no "?".
  if (order.status === "pending_ack" && isCreator) {
    return (
      <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
        <button
          type="button"
          disabled
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] px-4 py-2.5 text-sm font-semibold",
            "cursor-default border border-black/10 bg-[#EDE9E3] text-muted opacity-80",
          )}
        >
          {t("jobs.readAgreed")}
        </button>
        <p className="text-center text-[11px] text-muted">
          {t("jobs.awaitingAgreement")}
        </p>
      </div>
    );
  }

  return null;
}
