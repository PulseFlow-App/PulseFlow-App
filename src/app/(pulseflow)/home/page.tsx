"use client";

import { GuestHome } from "@/components/home/guest-home";
import { TodayScreen, TodaySkeleton } from "@/components/home/today-screen";
import { isGuestApp } from "@/lib/roles";
import { useData } from "@/lib/data/use-app-data";

export default function HomePage() {
  const data = useData();

  if (!data.ready || !data.profile) {
    return <TodaySkeleton />;
  }

  if (isGuestApp(data.profile.role)) {
    return <GuestHome name={data.profile.full_name} />;
  }

  return <TodayScreen data={data} />;
}
