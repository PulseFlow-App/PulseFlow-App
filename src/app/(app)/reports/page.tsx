"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Printer, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { canUseManagerReporting } from "@/lib/billing/reporting";
import { downloadCsv } from "@/lib/export/csv";
import {
  billsToCsv,
  budgetSheetToCsv,
  buildHandoffPayload,
  buildWeeklySummaryHtml,
  handoffToCsv,
  occupancyToCsv,
  serviceOrdersToCsv,
  tasksToCsv,
  villasToCsv,
  type HandoffPayload,
} from "@/lib/export/ops-export";
import {
  deleteHandoffSnapshot,
  listHandoffSnapshots,
  saveHandoffSnapshot,
} from "@/lib/handoff-snapshots";
import type { HandoffSnapshot } from "@/lib/types";
import { useDisplayCurrency } from "@/lib/billing/use-display-currency";
import { DisplayCurrencySelect } from "@/components/billing/display-currency-select";
import { formatShortDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

type PeriodKey = "all" | "this_month" | "last_30" | "last_90";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function inPeriod(iso: string, period: PeriodKey) {
  const created = new Date(iso);
  if (period === "all") return true;
  if (period === "this_month") return created >= startOfMonth();
  if (period === "last_30") return created >= daysAgo(30);
  if (period === "last_90") return created >= daysAgo(90);
  return true;
}

function weekLabel(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${formatShortDate(start.toISOString())} - ${formatShortDate(end.toISOString())}`;
}

export default function ReportsPage() {
  const data = useData();
  const router = useRouter();
  const { t } = useI18n();
  const { displayCurrency } = useDisplayCurrency();
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [filterVilla, setFilterVilla] = useState("");
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [snapshots, setSnapshots] = useState<HandoffSnapshot[]>([]);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = useMemo(
    () =>
      data.profile
        ? canUseManagerReporting({
            role: data.profile.role,
            orgKind: data.orgKind,
            organization: data.organization,
          })
        : false,
    [data.profile, data.orgKind, data.organization],
  );

  useEffect(() => {
    if (!data.ready) return;
    if (!allowed) router.replace("/home");
  }, [data.ready, allowed, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const villa = new URLSearchParams(window.location.search).get("villa");
    if (villa) setFilterVilla(villa);
  }, []);

  useEffect(() => {
    if (!data.profile || !allowed) return;
    void listHandoffSnapshots(data.profile.org_id)
      .then(setSnapshots)
      .catch((e: Error) => setError(e.message));
  }, [data.profile, allowed]);

  const filteredBills = useMemo(
    () =>
      data.bills.filter((b) => {
        if (!inPeriod(b.created_at, period)) return false;
        if (filterVilla && b.villa_id !== filterVilla) return false;
        return true;
      }),
    [data.bills, period, filterVilla],
  );
  const filteredTasks = useMemo(
    () =>
      data.tasks.filter((task) => {
        if (!inPeriod(task.created_at, period)) return false;
        if (filterVilla && task.villa_id !== filterVilla) return false;
        return true;
      }),
    [data.tasks, period, filterVilla],
  );
  const filteredOrders = useMemo(
    () =>
      data.serviceOrders.filter((o) => {
        if (!inPeriod(o.scheduled_date ?? o.created_at, period)) return false;
        if (filterVilla && o.villa_id !== filterVilla) return false;
        return true;
      }),
    [data.serviceOrders, period, filterVilla],
  );
  const filteredVillas = useMemo(
    () =>
      filterVilla
        ? data.allOrgVillas.filter((v) => v.id === filterVilla)
        : data.allOrgVillas,
    [data.allOrgVillas, filterVilla],
  );

  if (!data.ready || !data.profile || !allowed) return <LoadingState />;

  const stamp = new Date().toISOString().slice(0, 10);

  const printWeekly = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const html = buildWeeklySummaryHtml({
      orgName: data.orgName,
      weekLabel: weekLabel(now),
      generatedAt: now.toLocaleString(),
      villas: data.allOrgVillas,
      urgentTasks: data.tasks.filter(
        (task) =>
          task.status === "open" &&
          (task.priority === "urgent" ||
            (task.due_date && new Date(task.due_date) <= weekEnd)),
      ),
      pendingBills: data.bills.filter((b) => b.status === "pending"),
      upcomingOrders: data.serviceOrders.filter((o) => {
        if (o.status === "done" || o.status === "cancelled") return false;
        if (!o.scheduled_date) return true;
        const when = new Date(o.scheduled_date);
        return when >= weekStart && when < weekEnd;
      }),
      displayCurrency,
    });
    // Blob URL (not about:blank + document.write): noopener returns null and
    // leaves an empty tab, so we cannot write into that window.
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) {
      URL.revokeObjectURL(url);
      return;
    }
    w.opener = null;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const saveSnapshot = async () => {
    setSavingSnapshot(true);
    setError(null);
    try {
      const row = await saveHandoffSnapshot({
        orgId: data.profile!.org_id,
        profileId: data.profile!.id,
        label: snapshotLabel,
        payload: buildHandoffPayload({
          orgName: data.orgName,
          villas: data.allOrgVillas,
          tasks: data.tasks,
          bills: data.bills,
        }),
      });
      setSnapshots((prev) => [row, ...prev].slice(0, 20));
      setSnapshotLabel("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSavingSnapshot(false);
    }
  };

  const exportActions = [
    {
      key: "budget",
      label: t("reports.exportBudget"),
      onClick: () =>
        downloadCsv(`budget-${stamp}.csv`, budgetSheetToCsv(filteredBills)),
    },
    {
      key: "bills",
      label: t("reports.exportBills"),
      onClick: () =>
        downloadCsv(`bills-${stamp}.csv`, billsToCsv(filteredBills)),
    },
    {
      key: "tasks",
      label: t("reports.exportTasks"),
      onClick: () =>
        downloadCsv(`tasks-${stamp}.csv`, tasksToCsv(filteredTasks)),
    },
    {
      key: "properties",
      label: t("reports.exportProperties"),
      onClick: () =>
        downloadCsv(`properties-${stamp}.csv`, villasToCsv(filteredVillas)),
    },
    {
      key: "jobs",
      label: t("reports.exportJobs"),
      onClick: () =>
        downloadCsv(`jobs-${stamp}.csv`, serviceOrdersToCsv(filteredOrders)),
    },
    {
      key: "occupancy",
      label: t("reports.exportOccupancy"),
      onClick: () =>
        downloadCsv(`occupancy-${stamp}.csv`, occupancyToCsv(filteredVillas)),
    },
  ] as const;

  return (
    <div className="flex w-full flex-col gap-3 pb-28 pt-4">
      <div className="flex items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("reports.title")}
        </h1>
        <Link href="/settings" className="text-xs font-semibold text-primary">
          {t("settings.title")}
        </Link>
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <Card className="space-y-3 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="min-w-0">
            <Label>{t("reports.period")}</Label>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              aria-label={t("reports.period")}
            >
              <option value="all">{t("reports.periodAll")}</option>
              <option value="this_month">{t("reports.periodMonth")}</option>
              <option value="last_30">{t("reports.period30")}</option>
              <option value="last_90">{t("reports.period90")}</option>
            </Select>
          </div>
          <div className="min-w-0">
            <Label>{t("reports.property")}</Label>
            <Select
              value={filterVilla}
              onChange={(e) => setFilterVilla(e.target.value)}
              aria-label={t("reports.property")}
            >
              <option value="">{t("reports.allProperties")}</option>
              {data.allOrgVillas.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="min-w-0">
          <Label>{t("bills.currency")}</Label>
          <DisplayCurrencySelect aria-label={t("bills.currency")} />
          <p className="mt-1 text-xs text-ink/65">{t("bills.displayCurrencyHint")}</p>
        </div>
        <Button className="w-full" size="sm" onClick={printWeekly}>
          <Printer className="size-4" />
          {t("reports.printWeekly")}
        </Button>
        <details className="rounded-xl border border-[var(--color-border)] bg-canvas-deep/40">
          <summary className="cursor-pointer list-none px-3 py-2 font-display text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
            {t("reports.exportHint")}
          </summary>
          <div className="flex flex-col gap-1.5 border-t border-[var(--color-border)] px-3 py-2">
            {exportActions.map((action) => (
              <Button
                key={action.key}
                size="sm"
                variant="secondary"
                className="h-auto min-h-9 w-full justify-start px-3 py-2 text-left"
                onClick={action.onClick}
              >
                <Download className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 leading-snug">{action.label}</span>
              </Button>
            ))}
          </div>
        </details>
      </Card>

      <Card className="space-y-2.5 p-3 sm:p-4">
        <div>
          <h2 className="font-display text-base font-bold text-ink">
            {t("reports.handoffTitle")}
          </h2>
          <p className="mt-0.5 text-sm text-ink/70">{t("reports.handoffHint")}</p>
        </div>
        <Input
          value={snapshotLabel}
          onChange={(e) => setSnapshotLabel(e.target.value)}
          placeholder={t("reports.snapshotPlaceholder")}
          aria-label={t("reports.snapshotLabel")}
        />
        <Button
          className="w-full"
          size="sm"
          disabled={savingSnapshot}
          onClick={() => void saveSnapshot()}
        >
          {t("reports.saveSnapshot")}
        </Button>
        {snapshots.length > 0 ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/65">
            {t("reports.savedSnapshots")}
          </p>
        ) : null}
        {snapshots.length === 0 ? (
          <EmptyState title={t("reports.noSnapshots")} />
        ) : (
          <ul className="space-y-1.5">
            {snapshots.map((snapshot) => (
              <li
                key={snapshot.id}
                className="flex items-center justify-between rounded-xl bg-canvas-deep px-3 py-1.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {snapshot.label || t("reports.handoffTitle")}
                  </p>
                  <p className="text-xs text-ink/65">
                    {formatShortDate(snapshot.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      downloadCsv(
                        `handoff-${snapshot.created_at.slice(0, 10)}.csv`,
                        handoffToCsv(snapshot.payload as HandoffPayload),
                      )
                    }
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void deleteHandoffSnapshot(
                        snapshot.id,
                        data.profile!.org_id,
                      ).then(() =>
                        setSnapshots((prev) =>
                          prev.filter((s) => s.id !== snapshot.id),
                        ),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
