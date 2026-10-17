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
import { Screen } from "@/components/ui/page";
import Link from "next/link";
import { Plus } from "lucide-react";
import { canCreateVillas } from "@/lib/roles";

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

  const canAddProperty = canCreateVillas(data.profile.role);

  return (
    <Screen>
      {canAddProperty ? (
        <div className="flex justify-end">
          <Link
            href="/villas?add=1"
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[var(--radius-pill)] bg-primary px-2.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(242,106,54,0.22)] hover:bg-primary-dark"
          >
            <Plus className="size-3.5" strokeWidth={2.4} />
            {t("home.addProperty")}
          </Link>
        </div>
      ) : null}
      <HeroCard
        name={data.profile.full_name}
        attentionCount={attentionCount}
        attentionLabel={
          attentionCount === 0
            ? t("home.allSteady")
            : t("home.attention", { count: attentionCount })
        }
      />
      {/* Stack: 4 cards → focus → check-ins → task volume (never beside cards). */}
      <div className="animate-rise-delay space-y-3 md:space-y-6">
        <StatGrid counts={counts} />
        <UrgentTasks
          tasks={urgent}
          onDelete={async (id) => data.deleteTask(id)}
        />
        <DateStrip
          villas={data.villas}
          selected={selectedDay}
          onSelect={setSelectedDay}
        />
        <WeeklyChart tasks={data.tasks} />
      </div>
    </Screen>
  );
}
