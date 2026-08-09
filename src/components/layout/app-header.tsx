"use client";

import Link from "next/link";
import { Bell, Languages, MessageCircle, Settings, Star } from "lucide-react";
import { PulseMark } from "@/components/brand/pulse-mark";
import { brand } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/provider";

export function AppHeader({
  unreadMessages = 0,
  unreadNotifications = 0,
}: {
  unreadMessages?: number;
  unreadNotifications?: number;
}) {
  const { t } = useI18n();

  return (
    <header className="flex items-center justify-between gap-3 px-1 pb-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
      <Link href="/home" className="flex items-center gap-2.5">
        <PulseMark className="size-10 rounded-[0.9rem]" />
        <div>
          <p className="font-display text-lg font-bold leading-none text-ink">
            {brand.name}
          </p>
          <p className="mt-1 text-[11px] font-medium text-muted">
            {t("brand.opsPulse")}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-1.5">
        <Link
          href="/settings#language"
          className="flex size-11 items-center justify-center rounded-full bg-white text-ink soft-shadow"
          aria-label={t("nav.language")}
        >
          <Languages className="size-5" />
        </Link>
        <Link
          href="/notifications"
          className="relative flex size-11 items-center justify-center rounded-full bg-white text-ink soft-shadow"
          aria-label={t("nav.notifications")}
        >
          <Bell className="size-5" />
          {unreadNotifications > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          ) : null}
        </Link>
        <Link
          href="/endorsements"
          className="flex size-11 items-center justify-center rounded-full bg-white text-ink soft-shadow"
          aria-label={t("nav.endorsements")}
        >
          <Star className="size-5" />
        </Link>
        <Link
          href="/messages"
          className="relative flex size-11 items-center justify-center rounded-full bg-white text-ink soft-shadow"
          aria-label={t("nav.messages")}
        >
          <MessageCircle className="size-5" />
          {unreadMessages > 0 ? (
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary" />
          ) : null}
        </Link>
        <Link
          href="/settings"
          className="flex size-11 items-center justify-center rounded-full bg-white text-ink soft-shadow"
          aria-label={t("nav.settings")}
        >
          <Settings className="size-5" />
        </Link>
      </div>
    </header>
  );
}
