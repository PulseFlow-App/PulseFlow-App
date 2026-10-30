"use client";

import { useMemo, useState } from "react";
import { startOfDay } from "date-fns";
import { HeroCard } from "@/components/home/hero-card";
import { StatGrid } from "@/components/home/stat-grid";
import { DateStrip } from "@/components/home/date-strip";
import { WeeklyChart } from "@/components/home/weekly-chart";
import { UrgentTasks } from "@/components/home/urgent-tasks";
import { WeekSpendCard } from "@/components/home/week-spend-card";
import { StaffHome } from "@/components/home/staff-home";
import { LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { useDisplayCurrency } from "@/lib/billing/use-display-currency";
import type { VillaStatus } from "@/lib/design-tokens";
import { canViewBillFinance, isGuestApp, isStaffApp } from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import { GuestHome } from "@/components/home/guest-home";
import { Screen } from "@/components/ui/page";
import {
  buildFocusToday,
  flattenFocusToday,
} from "@/lib/home/focus-today";

function startOfWeekLocal(d = new Date()) {
  const start = startOfDay(d);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export default function HomePage() {
  const data = useData();
  const { t } = useI18n();
  const { displayCurrency, convertToDisplay } = useDisplayCurrency();
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

  const focusBundle = useMemo(
    () =>
      buildFocusToday({
        tasks: data.tasks,
        serviceOrders: data.serviceOrders,
        villas: data.villas,
        calendarBookings: data.calendarBookings,
      }),
    [data.tasks, data.serviceOrders, data.villas, data.calendarBookings],
  );
  const focusItems = useMemo(
    () => flattenFocusToday(focusBundle),
    [focusBundle],
  );
  const attentionCount = Math.max(
    counts.turnover + counts.maintenance,
    focusItems.length,
  );

  const showFinance = data.profile
    ? canViewBillFinance(data.profile.role, data.orgKind)
    : false;

  const weekSpend = useMemo(() => {
    if (!showFinance) return { spend: 0, pending: 0 };
    const weekStart = startOfWeekLocal();
    let spend = 0;
    let pending = 0;
    for (const b of data.bills) {
      const created = new Date(b.created_at);
      if (created < weekStart) continue;
      const amount = convertToDisplay(Number(b.amount), b.currency);
      spend += amount;
      if (b.status === "pending") pending += amount;
    }
    return { spend, pending };
  }, [data.bills, showFinance, convertToDisplay, displayCurrency]);

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
      {/* Stack: status → spend → focus → check-ins → task volume. */}
      <div className="animate-rise-delay space-y-3 md:space-y-6">
        <StatGrid counts={counts} />
        {showFinance ? (
          <WeekSpendCard
            spend={weekSpend.spend}
            pending={weekSpend.pending}
            displayCurrency={displayCurrency}
          />
        ) : null}
        <UrgentTasks
          bundle={focusBundle}
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
