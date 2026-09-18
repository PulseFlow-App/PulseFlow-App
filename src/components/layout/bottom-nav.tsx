"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building2,
  CheckSquare,
  Users,
  Receipt,
  CalendarClock,
  MessageCircle,
  BedDouble,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/data/use-app-data";
import { isGuestApp, isStaffApp } from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { PulseWordmark } from "@/components/brand/pulse-wordmark";
import { useBrandName } from "@/lib/i18n/use-brand-name";

type Tab = {
  href: string;
  labelKey: MessageKey;
  icon: typeof Home;
};

const mainTabs: Tab[] = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/villas", labelKey: "nav.villas", icon: Building2 },
  { href: "/tasks", labelKey: "nav.tasks", icon: CheckSquare },
  { href: "/contacts", labelKey: "nav.contacts", icon: Users },
  { href: "/bills", labelKey: "nav.bills", icon: Receipt },
];

const companyHostTabs: Tab[] = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/villas", labelKey: "nav.villas", icon: Building2 },
  { href: "/guests", labelKey: "nav.guests", icon: BedDouble },
  { href: "/tasks", labelKey: "nav.tasks", icon: CheckSquare },
  { href: "/messages", labelKey: "nav.chat", icon: MessageCircle },
  { href: "/bills", labelKey: "nav.bills", icon: Receipt },
];

const staffTabs: Tab[] = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/jobs", labelKey: "nav.jobs", icon: CalendarClock },
  { href: "/villas", labelKey: "nav.villas", icon: Building2 },
  { href: "/messages", labelKey: "nav.chat", icon: MessageCircle },
  { href: "/bills", labelKey: "nav.bills", icon: Receipt },
];

const guestTabs: Tab[] = [
  { href: "/home", labelKey: "guest.nav.stay", icon: Home },
  { href: "/villas", labelKey: "guest.nav.guide", icon: Building2 },
  { href: "/messages", labelKey: "guest.nav.support", icon: MessageCircle },
  { href: "/bills", labelKey: "guest.nav.bills", icon: Receipt },
];

/** Pressable fallback while profile/role is still loading. */
const loadingTabs: Tab[] = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/villas", labelKey: "nav.villas", icon: Building2 },
  { href: "/tasks", labelKey: "nav.tasks", icon: CheckSquare },
  { href: "/bills", labelKey: "nav.bills", icon: Receipt },
];

export function useAppTabs() {
  const data = useData();
  const role = data.profile?.role;
  const isCompanyHost =
    data.orgKind === "company" &&
    (role === "owner" || role === "manager");

  if (!data.ready || !role) return loadingTabs;

  if (isGuestApp(role)) return guestTabs;
  if (isStaffApp(role)) return staffTabs;
  if (isCompanyHost) return companyHostTabs;
  return mainTabs;
}

/** Desktop / tablet side rail — SaaS product chrome. */
export function SideNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const brandName = useBrandName();
  const tabs = useAppTabs();

  return (
    <aside className="hidden h-full w-[15.5rem] shrink-0 flex-col border-r border-[var(--color-border)] bg-card/80 px-3 py-4 backdrop-blur-md md:flex lg:w-[16.5rem]">
      <Link href="/home" className="mb-6 px-2" aria-label={brandName}>
        <PulseWordmark
          name={brandName}
          markClassName="size-9"
          textClassName="text-[1.05rem]"
        />
      </Link>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {tabs.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-primary-soft text-primary-dark"
                  : "text-muted hover:bg-sand-deep hover:text-ink",
              )}
            >
              <Icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
              <span className="truncate">{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>
      <Link
        href="/settings"
        className={cn(
          "mt-3 flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-semibold transition",
          pathname.startsWith("/settings")
            ? "bg-primary-soft text-primary-dark"
            : "text-muted hover:bg-sand-deep hover:text-ink",
        )}
      >
        <Settings className="size-5 shrink-0" strokeWidth={2} />
        <span>{t("nav.settings")}</span>
      </Link>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const tabs = useAppTabs();
  // 5 tabs + long localized labels overflow phones — icons only when crowded.
  const iconOnly = tabs.length >= 5;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
      <ul className="pointer-events-auto mx-auto flex h-12 w-full max-w-lg items-stretch justify-between gap-0 overflow-hidden rounded-2xl bg-nav px-0.5 shadow-[var(--shadow-nav)]">
        {tabs.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const label = t(labelKey);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                title={label}
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 transition",
                  active ? "bg-white/95 text-ink" : "text-white/75",
                )}
              >
                <Icon
                  className="size-4 shrink-0"
                  strokeWidth={active ? 2.4 : 1.9}
                  aria-hidden
                />
                {!iconOnly ? (
                  <span className="max-w-full truncate text-[8px] font-bold leading-none">
                    {label}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
