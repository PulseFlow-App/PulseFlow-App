"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { OfflineBanner } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);
  const data = useData();

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

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-sand px-4 pb-32">
      <OfflineBanner show={offline} />
      <AppHeader
        unreadMessages={data.unreadMessageCount}
        unreadNotifications={data.unreadNotificationCount}
      />
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
