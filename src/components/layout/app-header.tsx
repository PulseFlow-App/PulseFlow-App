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
  "relative flex size-8 shrink-0 items-center justify-center text-ink/85 transition hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

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
    <header className="sticky top-0 z-40 -mx-[var(--shell-pad)] mb-2 flex w-[calc(100%+2*var(--shell-pad))] max-w-none items-center justify-between gap-2 border-b border-[var(--color-border)] bg-sand/95 px-[var(--shell-pad)] pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-md md:static md:mx-0 md:mb-0 md:w-full md:justify-end md:border-0 md:bg-transparent md:px-0 md:py-4 md:pt-4 md:backdrop-blur-none">
      <Link
        href="/home"
        className="flex min-w-0 flex-1 items-center md:hidden"
        aria-label={brandName}
      >
        <PulseWordmark
          name={brandName}
          markClassName="size-8 rounded-[0.65rem]"
          textClassName="text-[1.05rem]"
        />
      </Link>
      <div className="flex shrink-0 items-center">
        <Link
          href="/notifications"
          className={headerIconBtn}
          aria-label={t("nav.notifications")}
        >
          <Bell className="size-4" strokeWidth={1.9} />
          {unreadNotifications > 0 ? (
            <span className="absolute right-0.5 top-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-bold text-white">
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
            <MessageCircle className="size-4" strokeWidth={1.9} />
            {unreadMessages > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
            ) : null}
          </Link>
        ) : null}
        <Link
          href="/settings"
          className={`${headerIconBtn} md:hidden`}
          aria-label={t("nav.settings")}
        >
          <Settings className="size-4" strokeWidth={1.9} />
        </Link>
        <AppMenuButton />
      </div>
    </header>
  );
}
