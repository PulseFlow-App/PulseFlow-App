/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
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
import { PulseMark } from "@/components/brand/pulse-mark";
import { PulseWordmark } from "@/components/brand/pulse-wordmark";
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

function tourIdForHref(href: string): string | undefined {
  if (href === "/villas") return "nav-properties";
  if (href === "/contacts") return "nav-contacts";
  if (href === "/jobs") return "nav-jobs";
  if (href === "/tasks") return "nav-tasks";
  if (href === "/bookings" || href === "/guests") return "nav-bookings";
  if (href === "/home") return "nav-home";
  return undefined;
}

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("pulse-nav-collapsed") === "1");
    } catch {
      /* private mode */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("pulse-nav-collapsed", next ? "1" : "0");
      } catch {
        /* private mode */
      }
      return next;
    });
  }

  const itemClass = (active: boolean) =>
    cn(
      "flex min-h-11 items-center gap-3 rounded-pf-control px-3 text-pf-14 font-medium",
      active
        ? "bg-pf-peach-100 text-pf-ink"
        : "text-pf-text-secondary hover:bg-pf-page hover:text-pf-ink",
    );

  return (
    <aside
      className={cn(
        "font-pf-chrome hidden h-full shrink-0 flex-col border-r border-pf-line bg-pf-page px-2 py-4 md:flex",
        collapsed ? "w-[4.5rem]" : "w-60",
      )}
    >
      <Link
        href="/home"
        className={cn("mb-4 flex items-center px-2", collapsed && "justify-center px-0")}
        aria-label={brandName}
      >
        {collapsed ? (
          <PulseMark className="size-9" />
        ) : (
          <PulseWordmark
            name={brandName}
            markClassName="size-9"
            textClassName="font-pf-sans text-pf-16 font-bold text-pf-ink"
          />
        )}
      </Link>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {tabs.map(({ href, labelKey, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const label = t(labelKey);
          return (
            <Link
              key={href}
              href={href}
              data-tour={tourIdForHref(href)}
              data-tour-label={label}
              aria-label={label}
              title={label}
              className={itemClass(active)}
            >
              <NavGlyph name={icon} active={active} onDark={false} />
              {collapsed ? null : <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-pressed={collapsed}
        aria-label={t("nav.menu")}
        className="mt-2 inline-flex min-h-11 items-center justify-center rounded-pf-control px-3 text-pf-14 font-medium text-pf-text-secondary"
      >
        {collapsed ? "›" : "‹"}
      </button>
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
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      data-tour="bottom-nav"
      data-tour-label={t("nav.home")}
    >
      <ul className="font-pf-chrome pointer-events-auto mx-auto flex h-14 w-full max-w-lg items-stretch justify-between gap-0 overflow-hidden rounded-pf-card border border-pf-line bg-pf-card/75 px-1 shadow-pf-1 backdrop-blur-xl">
        {tabs.map(({ href, labelKey, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const label = t(labelKey);
          const tourId = tourIdForHref(href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                title={label}
                data-tour={tourId}
                data-tour-label={label}
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-pf-control px-0.5",
                  !tabsReady && "pointer-events-none opacity-40",
                  active ? "bg-pf-peach-100 text-pf-ink" : "text-pf-text-tertiary",
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
