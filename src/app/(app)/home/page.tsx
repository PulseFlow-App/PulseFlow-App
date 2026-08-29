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
  const urgent = data.tasks.filter(
    (t) => t.status === "open" && t.priority === "urgent",
  );

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
    <div className="space-y-4 animate-rise">
      <HeroCard
        name={data.profile.full_name}
        attentionCount={attentionCount}
        attentionLabel={
          attentionCount === 0
            ? t("home.allSteady")
            : t("home.attention", { count: attentionCount })
        }
      />
      <div className="animate-rise-delay space-y-4">
        <StatGrid counts={counts} />
        <UrgentTasks
          tasks={urgent}
          onClose={async (id) => data.setTaskStatus(id, "done")}
        />
        <DateStrip
          villas={data.villas}
          selected={selectedDay}
          onSelect={setSelectedDay}
        />
        <WeeklyChart tasks={data.tasks} />
      </div>
    </div>
  );
}
