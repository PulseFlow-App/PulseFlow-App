"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  CheckCheck,
  MessageCircle,
  Receipt,
  ClipboardList,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { AgreeButton } from "@/components/jobs/agree-button";
import { useData } from "@/lib/data/use-app-data";
import type { NotificationKind } from "@/lib/types";
import { cn, formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useLocalizedDemoText } from "@/lib/demo/use-localized-demo-text";
import type { MessageKey } from "@/lib/i18n";

function kindIcon(kind: NotificationKind) {
  switch (kind) {
    case "check_in":
      return CalendarCheck;
    case "check_out":
      return CalendarX2;
    case "urgent_task":
      return AlertTriangle;
    case "task_assigned":
      return ClipboardList;
    case "message":
      return MessageCircle;
    case "bill_due":
    case "bill_submitted":
      return Receipt;
    case "appointment":
      return CalendarClock;
    default:
      return Bell;
  }
}

export default function NotificationsPage() {
  const data = useData();
  const { t } = useI18n();
  const label = useLocalizedDemoText();

  useEffect(() => {
    if (!data.ready || !data.profile) return;
    if (data.unreadNotificationCount <= 0) return;
    void data.markAllNotificationsRead();
    // Mark when the inbox is opened / while viewing so badges clear after checking.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open clear
  }, [data.ready, data.profile?.id, data.unreadNotificationCount]);

  if (!data.ready || !data.profile) return <LoadingState />;

  return (
    <div className="space-y-4 animate-rise font-sans">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {t("notifications.title")}
          </h1>
          <p className="text-sm text-muted">{t("notifications.subtitle")}</p>
        </div>
        {data.unreadNotificationCount > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void data.markAllNotificationsRead()}
          >
            <CheckCheck className="size-4" />
            {t("common.markAll")}
          </Button>
        ) : null}
      </div>

      {data.notifications.length === 0 ? (
        <EmptyState
          title={t("notifications.empty")}
          description={t("notifications.emptyHint")}
        />
      ) : (
        <ul className="space-y-2">
          {data.notifications.map((n) => {
            const unread = !(n.read_by ?? []).includes(data.profile!.id);
            const Icon = kindIcon(n.kind);
            const kindLabel = t(
              `notifications.kind.${n.kind}` as MessageKey,
            );
            const order =
              n.kind === "appointment" && n.entity_id
                ? data.serviceOrders.find((o) => o.id === n.entity_id)
                : null;
            const needsAgree =
              order &&
              order.status === "pending_ack" &&
              order.staff_profile_id === data.profile!.id;

            return (
              <li key={n.id} className="space-y-2">
                <Link
                  href={n.href ?? "/notifications"}
                  onClick={() => {
                    if (unread) void data.markNotificationRead(n.id);
                  }}
                  className="block"
                >
                  <Card
                    className={cn(
                      "flex gap-3 p-4 transition",
                      unread && "ring-1 ring-primary/25",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F7F5F1]",
                        unread && "bg-primary-soft",
                      )}
                    >
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-ink">{label(n.title)}</p>
                        {unread ? (
                          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-sm text-muted">{label(n.body)}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        {kindLabel}
                        {" · "}
                        {formatShortDate(n.created_at.slice(0, 10))}
                      </p>
                    </div>
                  </Card>
                </Link>
                {needsAgree && n.entity_id ? (
                  <AgreeButton orderId={n.entity_id} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
