"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { AgreeButton } from "@/components/jobs/agree-button";
import { VillaPhotoThumb } from "@/components/villas/villa-photo";
import { useData } from "@/lib/data/use-app-data";
import { formatWorkWindow } from "@/lib/notifications";
import {
  canCancelServiceOrder,
  canAgreeServiceOrder,
  canReopenServiceOrder,
  formatOrderWhen,
  orderReachabilityLabel,
} from "@/lib/service-orders";
import {
  isStaffApp,
  canBookServices,
  taskAssignableProfiles,
} from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import type { MessageKey } from "@/lib/i18n";

function CancelOrderButton({ orderId }: { orderId: string }) {
  const data = useData();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-1">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button
        size="sm"
        variant="ghost"
        className="w-full"
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
        {busy ? t("jobs.saving") : t("jobs.cancelOrder")}
      </Button>
    </div>
  );
}

function ReopenOrderPanel({ orderId }: { orderId: string }) {
  const data = useData();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assignees = useMemo(
    () => taskAssignableProfiles(data.profiles),
    [data.profiles],
  );

  if (!open) {
    return (
      <div className="space-y-2">
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setOpen(true);
              setAssignee("");
              setError(null);
            }}
          >
            {t("jobs.reassign")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError(null);
              void data
                .reopenServiceOrder(orderId, { assigned_to: null })
                .catch((e: unknown) =>
                  setError(e instanceof Error ? e.message : t("common.error")),
                )
                .finally(() => setBusy(false));
            }}
          >
            {busy ? t("jobs.saving") : t("jobs.repostOpen")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl bg-sand/50 p-3">
      <p className="text-xs text-muted">{t("jobs.repostHint")}</p>
      <div>
        <Label>{t("jobs.assigneeOptional")}</Label>
        <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">{t("tasks.unassigned")}</option>
          {assignees.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="flex-1"
          onClick={() => setOpen(false)}
        >
          {t("common.cancel")}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError(null);
            void data
              .reopenServiceOrder(orderId, {
                assigned_to: assignee || null,
              })
              .then(() => setOpen(false))
              .catch((e: unknown) =>
                setError(e instanceof Error ? e.message : t("common.error")),
              )
              .finally(() => setBusy(false));
          }}
        >
          {busy ? t("jobs.saving") : t("jobs.repostSend")}
        </Button>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const data = useData();
  const { t } = useI18n();
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
      if (staff) {
        return (
          o.staff_profile_id === data.profile!.id ||
          (!o.staff_profile_id && o.status === "pending_ack")
        );
      }
      return o.status !== "done";
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
              !!data.profile && canAgreeServiceOrder(data.profile, order);
            const canReopen =
              !!data.profile &&
              canReopenServiceOrder(data.profile, order, data.orgKind);
            const canCancel =
              !!data.profile &&
              canCancelServiceOrder(data.profile, order, data.orgKind);
            const photo =
              (order.villa_id && villaPhotoById.get(order.villa_id)) || null;
            const staffName = order.staff_profile_id
              ? data.profiles.find((p) => p.id === order.staff_profile_id)
                  ?.full_name
              : null;
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
                        <LocalizedText text={order.service_type} />
                      </p>
                      <p className="text-sm text-muted">
                        {order.location_label ?? t("tasks.villa")}
                        {staffName ? ` · ${staffName}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        order.status === "pending_ack"
                          ? "bg-warning/20 text-warning-dark"
                          : order.status === "agreed"
                            ? "bg-secondary/15 text-secondary-dark"
                            : order.status === "cancelled"
                              ? "bg-danger/10 text-danger"
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
                      {orderReachabilityLabel(order, t)}
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
                  {!staff && canCancel ? (
                    <CancelOrderButton orderId={order.id} />
                  ) : null}
                  {!staff && canReopen ? (
                    <ReopenOrderPanel orderId={order.id} />
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
            const workWindow = formatWorkWindow(
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
                    <LocalizedText text={task.title} />
                  </p>
                  <p className="truncate text-xs text-muted">
                    {task.villa?.name ?? t("common.general")}
                    {workWindow ? ` · ${workWindow}` : ""}
                  </p>
                </div>
                {task.priority === "urgent" ? (
                  <span className="text-[10px] font-bold uppercase text-danger">
                    Urgent
                  </span>
                ) : null}
                <button
                  type="button"
                  className="shrink-0 rounded-full p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
                  aria-label={t("common.delete")}
                  onClick={() => {
                    if (!window.confirm(t("tasks.deleteConfirm"))) return;
                    void data.deleteTask(task.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </Card>
            );
          })
        )}
      </section>

      {!staff ? (
        <p className="text-center text-xs text-muted">{t("jobs.tipOwner")}</p>
      ) : (
        <p className="text-center text-xs text-muted">{t("jobs.tipStaff")}</p>
      )}
    </div>
  );
}
