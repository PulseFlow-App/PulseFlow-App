"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { weeklyTaskOps } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { colors } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/provider";

export function WeeklyChart({ tasks }: { tasks: Task[] }) {
  const { t, locale } = useI18n();
  const data = useMemo(
    () => weeklyTaskOps(tasks, 5, locale),
    [tasks, locale],
  );
  const closed = data.reduce((sum, d) => sum + d.closed, 0);
  const opened = data.reduce((sum, d) => sum + d.opened, 0);
  const total = closed + opened;
  const pct = total === 0 ? 0 : Math.round((closed / total) * 100);
  const openedLabel = t("home.chartOpened");
  const closedLabel = t("home.chartClosed");

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-bold text-ink">{pct}%</p>
          <p className="text-sm text-muted">{t("home.weekVolumeClosed")}</p>
        </div>
        <div className="text-right text-xs text-muted">
          <p>
            <span className="font-semibold text-secondary">{closed}</span>{" "}
            {t("home.closedLabel")}
          </p>
          <p>
            <span className="font-semibold text-primary">{opened}</span>{" "}
            {t("home.openedLabel")}
          </p>
        </div>
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid vertical={false} stroke="#E5DFD2" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: colors.muted,
                fontSize: 12,
                fontFamily: "var(--font-pulse), Nunito, sans-serif",
              }}
            />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(43,33,28,0.04)" }}
              contentStyle={{
                borderRadius: 16,
                border: "none",
                boxShadow: "0 8px 24px rgba(43,33,28,0.1)",
                fontFamily: "var(--font-pulse), Nunito, sans-serif",
              }}
            />
            <Bar
              dataKey="opened"
              fill="#FFD2B8"
              radius={[10, 10, 10, 10]}
              name={openedLabel}
            />
            <Bar
              dataKey="closed"
              fill={colors.primary}
              radius={[10, 10, 10, 10]}
              name={closedLabel}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
