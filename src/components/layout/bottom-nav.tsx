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

const mainTabs: {
  href: string;
  labelKey: MessageKey;
  icon: typeof Home;
}[] = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/villas", labelKey: "nav.villas", icon: Building2 },
  { href: "/tasks", labelKey: "nav.tasks", icon: CheckSquare },
  { href: "/contacts", labelKey: "nav.contacts", icon: Users },
  { href: "/bills", labelKey: "nav.bills", icon: Receipt },
];

const companyHostTabs: {
  href: string;
  labelKey: MessageKey;
  icon: typeof Home;
}[] = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/villas", labelKey: "nav.villas", icon: Building2 },
  { href: "/guests", labelKey: "nav.guests", icon: BedDouble },
  { href: "/tasks", labelKey: "nav.tasks", icon: CheckSquare },
  { href: "/bills", labelKey: "nav.bills", icon: Receipt },
];

const staffTabs: {
  href: string;
  labelKey: MessageKey;
  icon: typeof Home;
}[] = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/jobs", labelKey: "nav.jobs", icon: CalendarClock },
  { href: "/villas", labelKey: "nav.villas", icon: Building2 },
  { href: "/messages", labelKey: "nav.chat", icon: MessageCircle },
  { href: "/bills", labelKey: "nav.bills", icon: Receipt },
];

const guestTabs = [
  { href: "/home", labelKey: "guest.nav.stay" as MessageKey, icon: Home },
  {
    href: "/villas",
    labelKey: "guest.nav.guide" as MessageKey,
    icon: Building2,
  },
  {
    href: "/messages",
    labelKey: "guest.nav.support" as MessageKey,
    icon: MessageCircle,
  },
  { href: "/bills", labelKey: "guest.nav.bills" as MessageKey, icon: Receipt },
];

export function useAppTabs() {
  const data = useData();
  const role = data.profile?.role;
  const isCompanyHost =
    data.orgKind === "company" &&
    (role === "owner" || role === "manager");

  if (!data.ready || !role) return [];

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

  if (!tabs.length) return null;

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

  if (!tabs.length) {
    return (
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
        aria-hidden
      >
        <ul className="flex w-full max-w-md items-center justify-between gap-1 rounded-full bg-nav px-2 py-1.5 shadow-[var(--shadow-nav)]">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex-1">
              <div className="mx-auto flex h-10 w-10 flex-col items-center justify-center gap-1">
                <div className="size-4 rounded-full bg-white/15" />
              </div>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <ul className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-0.5 rounded-full bg-nav px-1.5 py-1.5 shadow-[var(--shadow-nav)]">
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
                  "mx-auto flex h-11 w-full max-w-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-full px-1 transition",
                  active
                    ? "bg-white text-ink"
                    : "text-white/70 hover:text-white",
                )}
              >
                <Icon
                  className="size-[1.15rem] shrink-0"
                  strokeWidth={active ? 2.35 : 1.9}
                  aria-hidden
                />
                <span className="max-w-full truncate text-[9px] font-bold leading-none tracking-wide">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
