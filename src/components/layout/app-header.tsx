"use client";

import Link from "next/link";
import { PulseWordmark } from "@/components/brand/pulse-wordmark";
import { ThemeIconToggle } from "@/components/welcome/theme-icon-toggle";
import { useBrandName } from "@/lib/i18n/use-brand-name";
import { useI18n } from "@/lib/i18n/provider";
import { useData } from "@/lib/data/use-app-data";
import { canUseTeamChat } from "@/lib/roles";
import { PulseIcon } from "@/components/icons/pulse-icon";
import { AppMenuButton } from "./app-menu";

const headerIconBtn =
  "relative flex size-11 shrink-0 items-center justify-center text-pf-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600";

/**
 * Top-right icons (visual right → left): burger, theme, settings, chat, notifications.
 * DOM order is L→R so flex row yields that visual order at the end of the header.
 */
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
    <header className="font-pf-chrome sticky top-0 z-40 -mx-[var(--shell-pad)] mb-2 flex w-[calc(100%+2*var(--shell-pad))] max-w-none items-center justify-between gap-2 border-b border-pf-line bg-pf-page px-[var(--shell-pad)] pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 md:static md:mx-0 md:mb-0 md:w-full md:justify-end md:border-0 md:bg-transparent md:px-0 md:py-4 md:pt-4">
      <Link
        href="/home"
        className="flex min-w-0 flex-1 items-center md:hidden"
        aria-label={brandName}
      >
        <PulseWordmark
          name={brandName}
          markClassName="size-8 rounded-[0.65rem]"
          textClassName="font-pf-sans text-pf-16 font-bold text-pf-ink"
        />
      </Link>
      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          href="/notifications"
          className={headerIconBtn}
          aria-label={t("nav.notifications")}
        >
          <PulseIcon name="bell" className="size-4" />
          {unreadNotifications > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-pf-pill bg-pf-orange-500 px-1 text-[10px] font-medium text-white">
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
            <PulseIcon name="chat" className="size-4" />
            {unreadMessages > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
            ) : null}
          </Link>
        ) : null}
        <Link
          href="/settings"
          className={headerIconBtn}
          aria-label={t("nav.settings")}
        >
          <PulseIcon name="settings" className="size-4" />
        </Link>
        <ThemeIconToggle className="border-0 bg-transparent shadow-none" />
        <AppMenuButton />
      </div>
    </header>
  );
}
