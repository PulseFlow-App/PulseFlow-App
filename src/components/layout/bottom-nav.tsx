"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/data/use-app-data";
import { isGuestApp, isStaffApp } from "@/lib/roles";
import type { UserRole } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { PulseWordmark } from "@/components/brand/pulse-wordmark";
import { AppVersionMark } from "@/components/layout/app-version-mark";
import { useBrandName } from "@/lib/i18n/use-brand-name";
import {
  PulseIcon,
  type PulseIconName,
} from "@/components/icons/pulse-icon";

type Tab = {
  href: string;
  labelKey: MessageKey;
  icon: PulseIconName;
};

type TabSet = "company" | "main" | "staff" | "guest";

const NAV_TAB_SET_KEY = "pulseflow.navTabSet";

const mainTabs: Tab[] = [
  { href: "/home", labelKey: "nav.home", icon: "home" },
  { href: "/villas", labelKey: "nav.villas", icon: "properties" },
  { href: "/tasks", labelKey: "nav.tasks", icon: "tasks" },
  { href: "/contacts", labelKey: "nav.contacts", icon: "contacts" },
  { href: "/bills", labelKey: "nav.bills", icon: "bills" },
];

const companyHostTabs: Tab[] = [
  { href: "/home", labelKey: "nav.home", icon: "home" },
  { href: "/villas", labelKey: "nav.villas", icon: "properties" },
  { href: "/guests", labelKey: "nav.guests", icon: "guests" },
  { href: "/tasks", labelKey: "nav.tasks", icon: "tasks" },
  { href: "/contacts", labelKey: "nav.contacts", icon: "contacts" },
  { href: "/bills", labelKey: "nav.bills", icon: "bills" },
];

const staffTabs: Tab[] = [
  { href: "/home", labelKey: "nav.home", icon: "home" },
  { href: "/jobs", labelKey: "nav.jobs", icon: "jobs" },
  { href: "/villas", labelKey: "nav.villas", icon: "properties" },
  { href: "/messages", labelKey: "nav.chat", icon: "chat" },
  { href: "/bills", labelKey: "nav.bills", icon: "bills" },
];

const guestTabs: Tab[] = [
  { href: "/home", labelKey: "guest.nav.stay", icon: "home" },
  { href: "/villas", labelKey: "guest.nav.guide", icon: "properties" },
  { href: "/messages", labelKey: "guest.nav.support", icon: "chat" },
  { href: "/bills", labelKey: "guest.nav.bills", icon: "bills" },
];

function tabsForSet(set: TabSet): Tab[] {
  if (set === "guest") return guestTabs;
  if (set === "staff") return staffTabs;
  if (set === "company") return companyHostTabs;
  return mainTabs;
}

function readCachedTabSet(): TabSet | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(NAV_TAB_SET_KEY);
    if (v === "company" || v === "main" || v === "staff" || v === "guest") {
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeCachedTabSet(set: TabSet) {
  try {
    window.localStorage.setItem(NAV_TAB_SET_KEY, set);
  } catch {
    /* ignore */
  }
}

function resolveTabSet(
  role: UserRole | undefined,
  orgKind: string | null | undefined,
): TabSet | null {
  if (!role) return null;
  if (isGuestApp(role)) return "guest";
  if (isStaffApp(role)) return "staff";
  if (orgKind === "company" && (role === "owner" || role === "manager")) {
    return "company";
  }
  return "main";
}

export function useAppTabs() {
  const data = useData();
  const [cachedSet, setCachedSet] = useState<TabSet | null>(null);

  useEffect(() => {
    setCachedSet(readCachedTabSet());
  }, []);

  const resolved = resolveTabSet(data.profile?.role, data.orgKind);

  useEffect(() => {
    if (!data.ready || !resolved) return;
    setCachedSet(resolved);
    writeCachedTabSet(resolved);
  }, [data.ready, resolved]);

  if (data.ready && resolved) return tabsForSet(resolved);
  if (cachedSet) return tabsForSet(cachedSet);
  return companyHostTabs;
}

function NavGlyph({
  name,
  active,
  onDark,
}: {
  name: PulseIconName;
  active: boolean;
  onDark: boolean;
}) {
  return (
    <PulseIcon
      name={name}
      surface={onDark && !active ? "nav" : "canvas"}
      className="size-4 shrink-0 md:size-5"
      aria-hidden
    />
  );
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
        {tabs.map(({ href, labelKey, icon }) => {
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
              <NavGlyph name={icon} active={active} onDark={false} />
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
        <NavGlyph
          name="settings"
          active={pathname.startsWith("/settings")}
          onDark={false}
        />
        <span>{t("nav.settings")}</span>
      </Link>
      <AppVersionMark compact className="mt-3 px-2" />
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const data = useData();
  const tabs = useAppTabs();
  const iconOnly = tabs.length >= 5;
  const tabsReady = data.ready && Boolean(data.profile?.role);

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
      <ul className="pointer-events-auto mx-auto flex h-12 w-full max-w-lg items-stretch justify-between gap-0 overflow-hidden rounded-2xl bg-nav px-0.5 shadow-[var(--shadow-nav)]">
        {tabs.map(({ href, labelKey, icon }) => {
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
                  !tabsReady && "pointer-events-none opacity-40",
                  active ? "bg-white/95 text-ink" : "text-white/75",
                )}
                tabIndex={tabsReady ? undefined : -1}
              >
                <NavGlyph name={icon} active={active} onDark />
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
