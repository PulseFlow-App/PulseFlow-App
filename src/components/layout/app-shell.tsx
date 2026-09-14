"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "./app-header";
import { BottomNav, SideNav } from "./bottom-nav";
import { OfflineBanner } from "@/components/ui/empty-state";
import { TrialBanner } from "@/components/billing/billing-card";
import { useData } from "@/lib/data/use-app-data";
import { useIsDemoMode } from "@/lib/demo/use-is-demo-mode";
import { useI18n } from "@/lib/i18n/provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false);
  const data = useData();
  const pathname = usePathname();
  const { t } = useI18n();
  const demo = useIsDemoMode();

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
    <div className="app-shell mx-auto flex h-dvh w-full max-w-[90rem] overflow-hidden bg-transparent">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-28 md:pb-8"
          style={{ paddingInline: "var(--shell-pad)" }}
        >
          <div
            className="mx-auto w-full"
            style={{ maxWidth: "var(--shell-max)" }}
          >
            <OfflineBanner show={offline} />
            {demo ? (
              <div className="mb-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-secondary-soft px-4 py-3 text-sm text-secondary-dark">
                <p className="font-semibold">{t("demo.readOnlyBanner")}</p>
                <a
                  href="https://pulseflow.site"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex text-xs font-bold underline"
                >
                  Sign up
                </a>
              </div>
            ) : null}
            <TrialBanner />
            <AppHeader
              unreadMessages={data.unreadMessageCount}
              unreadNotifications={data.unreadNotificationCount}
            />
            <main className="w-full max-w-full pb-4">{children}</main>
          </div>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
