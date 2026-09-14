"use client";

import Link from "next/link";
import { Bell, MessageCircle, Settings } from "lucide-react";
import { PulseWordmark } from "@/components/brand/pulse-wordmark";
import { useBrandName } from "@/lib/i18n/use-brand-name";
import { useI18n } from "@/lib/i18n/provider";
import { useData } from "@/lib/data/use-app-data";
import { canUseTeamChat } from "@/lib/roles";
import { AppMenuButton } from "./app-menu";

const headerIconBtn =
  "relative flex size-9 items-center justify-center text-ink/85 transition hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-sand";

export function AppHeader({
  unreadMessages = 0,
  unreadNotifications = 0,
}: {
  unreadMessages?: number;
  unreadNotifications?: number;
}) {
  const { t } = useI18n();
  const brandName = useBrandName();
  const data = useData();
  const showChat =
    data.ready &&
    Boolean(data.profile?.role) &&
    canUseTeamChat(data.orgKind, data.profile?.role);

  return (
    <header className="flex w-full max-w-full items-center justify-between gap-3 overflow-visible pb-3 pt-[max(0.65rem,env(safe-area-inset-top))] md:justify-end md:pb-4 md:pt-4">
      <Link
        href="/home"
        className="flex min-w-0 flex-1 items-center overflow-visible md:hidden"
        aria-label={brandName}
      >
        <PulseWordmark name={brandName} />
      </Link>
      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          href="/notifications"
          className={headerIconBtn}
          aria-label={t("nav.notifications")}
        >
          <Bell className="size-[1.15rem]" strokeWidth={1.85} />
          {unreadNotifications > 0 ? (
            <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-white">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          ) : null}
        </Link>
        {showChat ? (
          <Link
            href="/messages"
            className={headerIconBtn}
            aria-label={t("nav.messages")}
          >
            <MessageCircle className="size-[1.15rem]" strokeWidth={1.85} />
            {unreadMessages > 0 ? (
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            ) : null}
          </Link>
        ) : null}
        <Link
          href="/settings"
          className={`${headerIconBtn} md:hidden`}
          aria-label={t("nav.settings")}
        >
          <Settings className="size-[1.15rem]" strokeWidth={1.85} />
        </Link>
        <AppMenuButton />
      </div>
    </header>
  );
}
