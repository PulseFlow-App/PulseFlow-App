"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { canUseManagerReporting } from "@/lib/billing/reporting";
import { formatShortDate } from "@/lib/utils";

export default function VillaStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const data = useData();
  const { t } = useI18n();

  const villa =
    data.villaList.find((v) => v.id === id) ??
    data.villas.find((v) => v.id === id) ??
    data.allOrgVillas.find((v) => v.id === id);

  const stats = useMemo(() => {
    const tasks = data.tasks.filter((x) => x.villa_id === id);
    const jobs = data.serviceOrders.filter((x) => x.villa_id === id);
    const bills = data.bills.filter((x) => x.villa_id === id);
    const maint = data.villaMaintenanceLogs.filter((x) => x.villa_id === id);
    const stays = data.guestStays.filter((x) => x.villa_id === id);

    const openTasks = tasks.filter((x) => x.status === "open").length;
    const doneTasks = tasks.filter((x) => x.status === "done").length;
    const pendingJobs = jobs.filter(
      (x) => x.status === "pending_ack" || x.status === "agreed",
    ).length;
    const doneJobs = jobs.filter((x) => x.status === "done").length;
    const spend = bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

    const dayMs = 86_400_000;
    const now = new Date();
    const months: { key: string; label: string; occupied: number; vacant: number }[] =
      [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const daysInMonth = end.getDate();
      let occupiedDays = 0;
      for (const stay of stays) {
        if (!stay.check_in || !stay.check_out) continue;
        const a = new Date(stay.check_in);
        const b = new Date(stay.check_out);
        const overlapStart = Math.max(a.getTime(), d.getTime());
        const overlapEnd = Math.min(b.getTime(), end.getTime() + dayMs);
        if (overlapEnd > overlapStart) {
          occupiedDays += Math.min(
            daysInMonth,
            Math.ceil((overlapEnd - overlapStart) / dayMs),
          );
        }
      }
      // Fall back to villa status window when no stay rows.
      if (!stays.length && villa?.check_in && villa?.check_out) {
        const a = new Date(villa.check_in);
        const b = new Date(villa.check_out);
        const overlapStart = Math.max(a.getTime(), d.getTime());
        const overlapEnd = Math.min(b.getTime(), end.getTime() + dayMs);
        if (overlapEnd > overlapStart) {
          occupiedDays += Math.min(
            daysInMonth,
            Math.ceil((overlapEnd - overlapStart) / dayMs),
          );
        }
      }
      occupiedDays = Math.min(daysInMonth, occupiedDays);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString(undefined, { month: "short" }),
        occupied: occupiedDays,
        vacant: Math.max(0, daysInMonth - occupiedDays),
      });
    }

    const maxOcc = Math.max(1, ...months.map((m) => m.occupied + m.vacant));

    return {
      openTasks,
      doneTasks,
      pendingJobs,
      doneJobs,
      spend,
      billCount: bills.length,
      maint,
      months,
      maxOcc,
      currency: bills[0]?.currency ?? "USD",
    };
  }, [
    data.tasks,
    data.serviceOrders,
    data.bills,
    data.villaMaintenanceLogs,
    data.guestStays,
    id,
    villa?.check_in,
    villa?.check_out,
  ]);

  if (!data.ready) return <LoadingState />;
  if (!villa) {
    return (
      <div className="space-y-3">
        <Link href="/villas" className="text-sm font-semibold text-primary">
          ← {t("common.back")}
        </Link>
        <p className="text-muted">{t("villas.notFound")}</p>
      </div>
    );
  }

  const canReport = data.profile
    ? canUseManagerReporting({
        role: data.profile.role,
        orgKind: data.orgKind,
        organization: data.organization,
      })
    : false;
  const taskTotal = stats.openTasks + stats.doneTasks || 1;
  const jobTotal = stats.pendingJobs + stats.doneJobs || 1;

  return (
    <div className="space-y-4 animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href="/villas"
            className="inline-flex items-center gap-1 text-sm font-semibold text-muted"
          >
            <ArrowLeft className="size-4" /> {t("common.back")}
          </Link>
          <h1 className="type-title mt-2">{villa.name}</h1>
          <p className="type-meta mt-1">{t("villas.propertyStats")}</p>
        </div>
        {canReport ? (
          <Link
            href={`/reports?villa=${encodeURIComponent(id)}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
          >
            <Download className="size-3.5" />
            {t("villas.downloadReports")}
          </Link>
        ) : null}
      </div>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold text-ink">{t("villas.statsOccupancy")}</p>
        <div className="flex items-end gap-2 h-36">
          {stats.months.map((m) => {
            const occH = (m.occupied / stats.maxOcc) * 100;
            const vacH = (m.vacant / stats.maxOcc) * 100;
            return (
              <div
                key={m.key}
                className="flex min-w-0 flex-1 flex-col items-center gap-1"
              >
                <div className="flex h-28 w-full flex-col justify-end gap-0.5">
                  <div
                    className="w-full rounded-t-md bg-secondary/80"
                    style={{ height: `${occH}%` }}
                    title={`${m.occupied} occupied`}
                  />
                  <div
                    className="w-full rounded-b-md bg-canvas-deep"
                    style={{ height: `${Math.max(vacH, 4)}%` }}
                    title={`${m.vacant} vacant`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-muted">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-secondary/80" /> Occupied
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-canvas-deep" /> Vacant
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="space-y-2 p-4">
          <p className="text-sm font-semibold text-ink">{t("villas.statsTasks")}</p>
          <Donut
            a={stats.doneTasks}
            b={stats.openTasks}
            total={taskTotal}
            aLabel="Done"
            bLabel="Open"
          />
          <p className="text-xs text-muted">
            {stats.doneTasks} done · {stats.openTasks} open
          </p>
        </Card>
        <Card className="space-y-2 p-4">
          <p className="text-sm font-semibold text-ink">{t("villas.statsJobs")}</p>
          <Donut
            a={stats.doneJobs}
            b={stats.pendingJobs}
            total={jobTotal}
            aLabel="Done"
            bLabel="Open"
          />
          <p className="text-xs text-muted">
            {stats.doneJobs} done · {stats.pendingJobs} open
          </p>
        </Card>
      </div>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold text-ink">{t("villas.statsSpend")}</p>
        <p className="font-display text-3xl font-bold text-ink">
          {stats.spend.toLocaleString(undefined, {
            style: "currency",
            currency: stats.currency || "USD",
            maximumFractionDigits: 0,
          })}
        </p>
        <p className="text-xs text-muted">{stats.billCount} bills</p>
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold text-ink">
          {t("villas.statsMaintenance")}
        </p>
        {stats.maint.length === 0 ? (
          <p className="text-sm text-muted">{t("villas.statsEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {stats.maint.slice(0, 8).map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-canvas-deep px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {entry.item}
                  </p>
                  {entry.vendor ? (
                    <p className="truncate text-xs text-muted">{entry.vendor}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {formatShortDate(entry.logged_on)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Donut({
  a,
  b,
  total,
  aLabel,
  bLabel,
}: {
  a: number;
  b: number;
  total: number;
  aLabel: string;
  bLabel: string;
}) {
  const aPct = Math.round((a / total) * 100);
  return (
    <div
      className="mx-auto size-24 rounded-full"
      style={{
        background: `conic-gradient(var(--color-secondary) 0 ${aPct}%, var(--color-canvas-deep, #e8f4f8) ${aPct}% 100%)`,
      }}
      title={`${aLabel} ${a} / ${bLabel} ${b}`}
    >
      <div className="flex size-full items-center justify-center p-4">
        <div className="flex size-full items-center justify-center rounded-full bg-card text-sm font-bold text-ink">
          {aPct}%
        </div>
      </div>
    </div>
  );
}
