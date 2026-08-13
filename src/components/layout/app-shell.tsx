"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { OfflineBanner } from "@/components/ui/empty-state";
import { TrialBanner } from "@/components/billing/billing-card";
import { useData } from "@/lib/data/use-app-data";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);
  const data = useData();
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  // Clear badges whenever those screens are open (not only via page effects).
  useEffect(() => {
    if (!data.ready || !data.profile) return;
    if (
      pathname.startsWith("/notifications") &&
      data.unreadNotificationCount > 0
    ) {
      void data.markAllNotificationsRead();
      return;
    }
    if (pathname.startsWith("/messages") && data.unreadMessageCount > 0) {
      void data.markAllNotificationsRead("message");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- route + unread driven clear
  }, [
    pathname,
    data.ready,
    data.profile?.id,
    data.unreadNotificationCount,
    data.unreadMessageCount,
  ]);

  return (
    <div className="app-shell mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden bg-sand">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 pb-28">
        <OfflineBanner show={offline} />
        <TrialBanner />
        <AppHeader
          unreadMessages={data.unreadMessageCount}
          unreadNotifications={data.unreadNotificationCount}
        />
        <main className="w-full max-w-full">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
