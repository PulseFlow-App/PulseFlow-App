"use client";

import { useMemo, useState } from "react";
import { startOfDay } from "date-fns";
import { HeroCard } from "@/components/home/hero-card";
import { StatGrid } from "@/components/home/stat-grid";
import { DateStrip } from "@/components/home/date-strip";
import { WeeklyChart } from "@/components/home/weekly-chart";
import { UrgentTasks } from "@/components/home/urgent-tasks";
import { StaffHome } from "@/components/home/staff-home";
import { LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import type { VillaStatus } from "@/lib/design-tokens";
import { isGuestApp, isStaffApp } from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import { GuestHome } from "@/components/home/guest-home";
import { Screen, Grid12, Col } from "@/components/ui/page";

export default function HomePage() {
  const data = useData();
  const { t } = useI18n();
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));

  const counts = useMemo(() => {
    const base: Record<VillaStatus, number> = {
      occupied: 0,
      available: 0,
      turnover: 0,
      maintenance: 0,
    };
    for (const v of data.villas) base[v.status] += 1;
    return base;
  }, [data.villas]);

  const attentionCount = counts.turnover + counts.maintenance;
  const urgent = useMemo(() => {
    return data.tasks
      .filter(
        (task) =>
          task.priority === "urgent" &&
          (task.status === "open" || task.status === "pending_verify"),
      )
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "pending_verify" ? -1 : 1;
        }
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return a.title.localeCompare(b.title);
      });
  }, [data.tasks]);

  if (!data.ready || !data.profile) {
    return <LoadingState label={t("home.loading")} />;
  }

  if (isGuestApp(data.profile.role)) {
    return <GuestHome name={data.profile.full_name} />;
  }

  if (isStaffApp(data.profile.role)) {
    return <StaffHome data={data} />;
  }

  return (
    <Screen>
      <HeroCard
        name={data.profile.full_name}
        attentionCount={attentionCount}
        attentionLabel={
          attentionCount === 0
            ? t("home.allSteady")
            : t("home.attention", { count: attentionCount })
        }
      />
      <div className="animate-rise-delay">
        <Grid12>
          <Col span={8} className="space-y-3 md:space-y-6">
            <StatGrid counts={counts} />
            <UrgentTasks
              tasks={urgent}
              onDelete={async (id) => data.deleteTask(id)}
            />
          </Col>
          <Col span={4} className="space-y-4 md:space-y-6">
            <DateStrip
              villas={data.villas}
              selected={selectedDay}
              onSelect={setSelectedDay}
            />
            <WeeklyChart tasks={data.tasks} />
          </Col>
        </Grid12>
      </div>
    </Screen>
  );
}
