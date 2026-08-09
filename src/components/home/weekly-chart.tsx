"use client";

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

export function WeeklyChart({ tasks }: { tasks: Task[] }) {
  const data = weeklyTaskOps(tasks, 5);
  const closed = data.reduce((sum, d) => sum + d.closed, 0);
  const opened = data.reduce((sum, d) => sum + d.opened, 0);
  const total = closed + opened;
  const pct = total === 0 ? 0 : Math.round((closed / total) * 100);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-bold text-ink">{pct}%</p>
          <p className="text-sm text-muted">
            of this week&apos;s task volume closed
          </p>
        </div>
        <div className="text-right text-xs text-muted">
          <p>
            <span className="font-semibold text-secondary">{closed}</span> closed
          </p>
          <p>
            <span className="font-semibold text-primary">{opened}</span> opened
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
              name="Opened"
            />
            <Bar
              dataKey="closed"
              fill={colors.primary}
              radius={[10, 10, 10, 10]}
              name="Closed"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
