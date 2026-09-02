"use client";

import Link from "next/link";
import { Bell, MessageCircle, Settings } from "lucide-react";
import { PulseMark } from "@/components/brand/pulse-mark";
import { useBrandName } from "@/lib/i18n/use-brand-name";
import { useI18n } from "@/lib/i18n/provider";
import { useData } from "@/lib/data/use-app-data";
import { canUseTeamChat } from "@/lib/roles";
import { AppMenuButton } from "./app-menu";

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
    <header className="flex w-full max-w-full items-center justify-between gap-2 overflow-hidden pb-3 pt-[max(0.65rem,env(safe-area-inset-top))]">
      <Link href="/home" className="flex min-w-0 flex-1 items-center gap-2">
        <PulseMark className="size-9 shrink-0 rounded-[0.8rem]" />
        <p className="truncate font-display text-[15px] font-bold leading-tight text-ink sm:text-base">
          {brandName}
        </p>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href="/notifications"
          className="relative flex size-9 items-center justify-center rounded-full bg-white text-ink soft-shadow"
          aria-label={t("nav.notifications")}
        >
          <Bell className="size-4" />
          {unreadNotifications > 0 ? (
            <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-white">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          ) : null}
        </Link>
        {showChat ? (
          <Link
            href="/messages"
            className="relative flex size-9 items-center justify-center rounded-full bg-white text-ink soft-shadow"
            aria-label={t("nav.messages")}
          >
            <MessageCircle className="size-4" />
            {unreadMessages > 0 ? (
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            ) : null}
          </Link>
        ) : null}
        <Link
          href="/settings"
          className="flex size-9 items-center justify-center rounded-full bg-white text-ink soft-shadow"
          aria-label={t("nav.settings")}
        >
          <Settings className="size-4" />
        </Link>
        <AppMenuButton />
      </div>
    </header>
  );
}
