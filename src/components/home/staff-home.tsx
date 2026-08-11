"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AgreeButton } from "@/components/jobs/agree-button";
import { HeroCard } from "@/components/home/hero-card";
import { VillaPhotoThumb } from "@/components/villas/villa-photo";
import type { AppData } from "@/lib/data/use-app-data";
import { formatWorkWindow } from "@/lib/notifications";
import { formatOrderWhen, orderStatusLabel } from "@/lib/service-orders";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function StaffHome({ data }: { data: AppData }) {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);

  const villaPhotoById = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const v of data.villas) map.set(v.id, v.photo_url);
    for (const v of data.allOrgVillas) {
      if (!map.has(v.id)) map.set(v.id, v.photo_url);
    }
    return map;
  }, [data.villas, data.allOrgVillas]);

  const todayOrders = useMemo(
    () =>
      data.serviceOrders.filter(
        (o) =>
          o.staff_profile_id === data.profile?.id &&
          o.scheduled_date <= today &&
          o.status !== "cancelled" &&
          o.status !== "done",
      ),
    [data.serviceOrders, data.profile?.id, today],
  );

  const pendingAck = todayOrders.filter((o) => o.status === "pending_ack");

  const todayTasks = useMemo(
    () =>
      data.tasks.filter(
        (t) =>
          t.status === "open" &&
          t.assigned_to === data.profile?.id &&
          (!t.due_date || t.due_date <= today),
      ),
    [data.tasks, data.profile?.id, today],
  );

  return (
    <div className="space-y-4 animate-rise font-sans">
      <HeroCard
        name={data.profile!.full_name}
        attentionCount={pendingAck.length}
        attentionLabel={
          pendingAck.length === 0
            ? t("home.staffClear")
            : t("home.staffPending", { count: pendingAck.length })
        }
      />

      {pendingAck.length > 0 ? (
        <Card className="space-y-3 border border-primary/20 bg-primary-soft/40 p-4">
          <div>
            <p className="text-sm font-bold text-ink">
              {t("home.needsAgreement")}
            </p>
            <p className="text-xs text-muted">{t("home.needsAgreementHint")}</p>
          </div>
          {pendingAck.map((order) => {
            const photo =
              (order.villa_id && villaPhotoById.get(order.villa_id)) || null;
            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl bg-white soft-shadow"
              >
                {photo ? (
                  <VillaPhotoThumb
                    src={photo}
                    alt={order.location_label ?? "Property"}
                    className="rounded-none"
                  />
                ) : null}
                <div className="p-3">
                  <p className="font-semibold text-ink">{order.service_type}</p>
                  <p className="text-sm text-muted">
                    {order.location_label} · {formatOrderWhen(order)}
                  </p>
                  <AgreeButton orderId={order.id} className="mt-3" />
                </div>
              </div>
            );
          })}
        </Card>
      ) : null}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">
            {t("home.todayOverdue")}
          </h2>
          <Link href="/jobs" className="text-xs font-semibold text-primary">
            {t("home.allJobs")}
          </Link>
        </div>
        {todayOrders.length === 0 && todayTasks.length === 0 ? (
          <Card className="p-4 text-sm text-muted">{t("home.noJobs")}</Card>
        ) : null}
        {todayOrders.map((order) => (
          <Card key={order.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{order.service_type}</p>
                <p className="text-xs text-muted">
                  {order.location_label} · {formatOrderWhen(order)}
                </p>
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase",
                  order.status === "pending_ack"
                    ? "text-warning-dark"
                    : "text-secondary",
                )}
              >
                {orderStatusLabel(order.status)}
              </span>
            </div>
          </Card>
        ))}
        {todayTasks
          .filter((t) => !t.service_order_id)
          .map((task) => (
            <Card key={task.id} className="flex items-center gap-3 p-3">
              <button
                type="button"
                className="size-5 rounded-full border-2 border-secondary"
                aria-label="Mark done"
                onClick={() => void data.setTaskStatus(task.id, "done")}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{task.title}</p>
                <p className="text-xs text-muted">
                  {task.villa?.name ?? "General"}
                  {formatWorkWindow(
                    task.due_date,
                    task.time_start,
                    task.time_end,
                  )
                    ? ` · ${formatWorkWindow(
                        task.due_date,
                        task.time_start,
                        task.time_end,
                      )}`
                    : ""}
                </p>
              </div>
            </Card>
          ))}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/villas">
          <Button variant="secondary" className="w-full">
            {t("home.myVillas")}
          </Button>
        </Link>
        <Link href="/jobs">
          <Button className="w-full">{t("home.schedule")}</Button>
        </Link>
      </div>
    </div>
  );
}
