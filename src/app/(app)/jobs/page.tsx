"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { AgreeButton } from "@/components/jobs/agree-button";
import { VillaPhotoThumb } from "@/components/villas/villa-photo";
import { useData } from "@/lib/data/use-app-data";
import { formatWorkWindow } from "@/lib/notifications";
import { formatOrderWhen } from "@/lib/service-orders";
import { isStaffApp, canBookServices } from "@/lib/roles";
import { cn, formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { useLocalizedDemoText } from "@/lib/demo/use-localized-demo-text";
import type { MessageKey } from "@/lib/i18n";

export default function JobsPage() {
  const data = useData();
  const { t } = useI18n();
  const label = useLocalizedDemoText();
  const staff = data.profile ? isStaffApp(data.profile.role) : false;
  const booker = data.profile
    ? canBookServices(data.profile.role, data.orgKind)
    : false;

  const villaPhotoById = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const v of data.villas) map.set(v.id, v.photo_url);
    for (const v of data.allOrgVillas) {
      if (!map.has(v.id)) map.set(v.id, v.photo_url);
    }
    return map;
  }, [data.villas, data.allOrgVillas]);

  const myOrders = useMemo(() => {
    if (!data.profile) return [];
    const list = data.serviceOrders.filter((o) => {
      if (staff) return o.staff_profile_id === data.profile!.id;
      return true;
    });
    return [...list].sort((a, b) => {
      const da = `${a.scheduled_date}${a.time_start ?? ""}`;
      const db = `${b.scheduled_date}${b.time_start ?? ""}`;
      return da.localeCompare(db);
    });
  }, [data.serviceOrders, data.profile, staff]);

  const myTasks = useMemo(() => {
    if (!data.profile) return [];
    return data.tasks.filter((task) => {
      if (task.status !== "open") return false;
      if (staff) return task.assigned_to === data.profile!.id;
      return true;
    });
  }, [data.tasks, data.profile, staff]);

  if (!data.ready || !data.profile) return <LoadingState />;

  return (
    <div className="space-y-4 animate-rise font-sans">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink">
            {staff ? t("jobs.titleStaff") : t("jobs.titleOwner")}
          </h1>
          <p className="text-sm text-muted">
            {staff ? t("jobs.subtitleStaff") : t("jobs.subtitleOwner")}
          </p>
        </div>
        {booker ? (
          <Link href="/contacts">
            <Button size="sm">{t("jobs.orderStaff")}</Button>
          </Link>
        ) : null}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">
          {t("jobs.appointments")}
        </h2>
        {myOrders.length === 0 ? (
          <EmptyState
            title={t("jobs.noAppointments")}
            description={
              staff
                ? t("jobs.noAppointmentsStaff")
                : t("jobs.noAppointmentsOwner")
            }
          />
        ) : (
          myOrders.map((order) => {
            const pendingForMe =
              staff &&
              order.status === "pending_ack" &&
              order.staff_profile_id === data.profile!.id;
            const photo =
              (order.villa_id && villaPhotoById.get(order.villa_id)) || null;
            return (
              <Card
                key={order.id}
                className={cn(
                  "space-y-0 overflow-hidden p-0",
                  pendingForMe && "ring-1 ring-primary/30",
                )}
              >
                {photo ? (
                  <VillaPhotoThumb
                    src={photo}
                    alt={order.location_label ?? t("tasks.villa")}
                    className="rounded-none"
                  />
                ) : null}
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">
                        {label(order.service_type)}
                      </p>
                      <p className="text-sm text-muted">
                        {order.location_label ?? t("tasks.villa")}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        order.status === "pending_ack"
                          ? "bg-warning/20 text-warning-dark"
                          : order.status === "agreed"
                            ? "bg-secondary/15 text-secondary-dark"
                            : "bg-[#F7F5F1] text-muted",
                      )}
                    >
                      {t(`order.status.${order.status}` as MessageKey)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-ink">
                    {formatOrderWhen(order)}
                  </p>
                  {order.details ? (
                    <p className="text-sm text-muted">{order.details}</p>
                  ) : null}
                  {!staff ? (
                    <p className="text-xs font-semibold text-muted">
                      {!order.staff_profile_id
                        ? t("order.reach.offline")
                        : order.status === "pending_ack"
                          ? t("order.reach.pending")
                          : order.status === "agreed"
                            ? t("order.reach.confirmed")
                            : t(`order.status.${order.status}` as MessageKey)}
                    </p>
                  ) : null}
                  {pendingForMe ? <AgreeButton orderId={order.id} /> : null}
                  {staff && order.status === "agreed" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => void data.completeServiceOrder(order.id)}
                    >
                      {t("jobs.markDone")}
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">
          {staff ? t("jobs.taskList") : t("jobs.openTasks")}
        </h2>
        {myTasks.length === 0 ? (
          <p className="text-sm text-muted">{t("jobs.noOpenTasks")}</p>
        ) : (
          myTasks.map((task) => {
            const window = formatWorkWindow(
              task.due_date,
              task.time_start,
              task.time_end,
            );
            return (
              <Card key={task.id} className="flex items-center gap-3 p-3">
                <button
                  type="button"
                  className="size-5 rounded-full border-2 border-secondary"
                  aria-label="Mark done"
                  onClick={() => void data.setTaskStatus(task.id, "done")}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">
                    {label(task.title)}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {task.villa?.name ?? t("common.general")}
                    {window ? ` · ${window}` : ""}
                  </p>
                </div>
                {task.priority === "urgent" ? (
                  <span className="text-[10px] font-bold uppercase text-danger">
                    Urgent
                  </span>
                ) : null}
              </Card>
            );
          })
        )}
      </section>

      {!staff ? (
        <p className="text-center text-xs text-muted">{t("jobs.tipOwner")}</p>
      ) : (
        <p className="text-center text-xs text-muted">
          {t("jobs.tipStaff")}
          {myTasks[0]?.due_date
            ? ` ${formatShortDate(myTasks[0].due_date)}`
            : ""}
        </p>
      )}
    </div>
  );
}
