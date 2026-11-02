"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "./app-header";
import { BottomNav, SideNav } from "./bottom-nav";
import { OfflineBanner } from "@/components/ui/empty-state";
import { TrialBanner } from "@/components/billing/billing-card";
import { ReviewOfferBanner } from "@/components/tasks/review-offer-banner";
import { DataProvider } from "@/lib/data/data-provider";
import { useData } from "@/lib/data/use-app-data";
import { useIsDemoMode } from "@/lib/demo/use-is-demo-mode";
import { useI18n } from "@/lib/i18n/provider";
import { EducationProvider } from "@/lib/education/provider";
import { EducationTour } from "@/components/education/education-tour";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <EducationProvider>
        <AppShellInner>{children}</AppShellInner>
      </EducationProvider>
    </DataProvider>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
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
    }
    // Team chat marks message notifications read itself after picking the
    // correct channel tab — clearing here would hide which thread had mail.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- route + unread driven clear
  }, [
    pathname,
    data.ready,
    data.profile?.id,
    data.unreadNotificationCount,
  ]);

  return (
    <div className="app-shell font-pf-sans mx-auto flex h-dvh w-full max-w-[90rem] overflow-hidden bg-pf-page text-pf-ink">
      <SideNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] md:pb-8"
          style={{
            paddingInline:
              "max(var(--shell-pad), env(safe-area-inset-left)) max(var(--shell-pad), env(safe-area-inset-right))",
          }}
        >
          <div
            className="mx-auto w-full min-w-0"
            style={{ maxWidth: "var(--shell-max)" }}
          >
            <AppHeader
              unreadMessages={data.unreadMessageCount}
              unreadNotifications={data.unreadNotificationCount}
            />
            <OfflineBanner show={offline} />
            {demo ? (
              <div className="mb-3 rounded-pf-card border border-pf-line bg-pf-card px-3 py-3 text-pf-14 text-pf-text-secondary">
                <p className="font-medium text-pf-ink">{t("demo.readOnlyBanner")}</p>
                <a
                  href="https://pulseflow.site"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex min-h-11 items-center font-medium text-pf-ink underline"
                >
                  {t("auth.register")}
                </a>
              </div>
            ) : null}
            <TrialBanner />
            <main className="w-full max-w-full pb-4">{children}</main>
          </div>
        </div>
        <BottomNav />
        <ReviewOfferBanner />
        <EducationTour />
      </div>
    </div>
  );
}
