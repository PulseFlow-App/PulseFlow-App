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
    <div className="app-shell mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden bg-sand">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 pb-28">
        <OfflineBanner show={offline} />
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
