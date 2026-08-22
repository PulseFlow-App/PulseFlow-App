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
import { canUseBasicReporting } from "@/lib/billing/reporting";
import { downloadCsv } from "@/lib/export/csv";
import {
  billsToCsv,
  buildHandoffPayload,
  buildWeeklySummaryHtml,
  handoffToCsv,
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
  return `${formatShortDate(start.toISOString())} – ${formatShortDate(end.toISOString())}`;
}

export default function ReportsPage() {
  const data = useData();
  const router = useRouter();
  const { t } = useI18n();
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [snapshots, setSnapshots] = useState<HandoffSnapshot[]>([]);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = useMemo(
    () =>
      data.profile
        ? canUseBasicReporting({
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
    if (!data.profile || !allowed) return;
    void listHandoffSnapshots(data.profile.org_id)
      .then(setSnapshots)
      .catch((e: Error) => setError(e.message));
  }, [data.profile, allowed]);

  const filteredBills = useMemo(
    () => data.bills.filter((b) => inPeriod(b.created_at, period)),
    [data.bills, period],
  );
  const filteredTasks = useMemo(
    () => data.tasks.filter((task) => inPeriod(task.created_at, period)),
    [data.tasks, period],
  );
  const filteredOrders = useMemo(
    () =>
      data.serviceOrders.filter((o) =>
        inPeriod(o.scheduled_date ?? o.created_at, period),
      ),
    [data.serviceOrders, period],
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
        if (o.status === "done") return false;
        const when = new Date(o.scheduled_date);
        return when >= weekStart && when < weekEnd;
      }),
    });
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.write(html);
    w.document.close();
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

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3 px-4 pb-28 pt-4">
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

      <Card className="space-y-3 p-4">
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
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              downloadCsv(`bills-${stamp}.csv`, billsToCsv(filteredBills))
            }
          >
            {t("reports.exportBills")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              downloadCsv(`tasks-${stamp}.csv`, tasksToCsv(filteredTasks))
            }
          >
            {t("reports.exportTasks")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              downloadCsv(
                `properties-${stamp}.csv`,
                villasToCsv(data.allOrgVillas),
              )
            }
          >
            {t("reports.exportProperties")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              downloadCsv(
                `jobs-${stamp}.csv`,
                serviceOrdersToCsv(filteredOrders),
              )
            }
          >
            {t("reports.exportJobs")}
          </Button>
        </div>
        <Button className="w-full" size="sm" onClick={printWeekly}>
          <Printer className="size-4" />
          {t("reports.printWeekly")}
        </Button>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="font-display text-base font-bold text-ink">
          {t("reports.handoffTitle")}
        </h2>
        <Input
          value={snapshotLabel}
          onChange={(e) => setSnapshotLabel(e.target.value)}
          placeholder={t("reports.snapshotPlaceholder")}
        />
        <Button
          className="w-full"
          size="sm"
          disabled={savingSnapshot}
          onClick={() => void saveSnapshot()}
        >
          {t("reports.saveSnapshot")}
        </Button>
        {snapshots.length === 0 ? (
          <EmptyState title={t("reports.noSnapshots")} />
        ) : (
          <ul className="space-y-2">
            {snapshots.map((snapshot) => (
              <li
                key={snapshot.id}
                className="flex items-center justify-between rounded-2xl bg-[#F7F5F1] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {snapshot.label || "Handoff"}
                  </p>
                  <p className="text-xs text-muted">
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
