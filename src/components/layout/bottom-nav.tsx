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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/data/use-app-data";
import { isGuestApp, isStaffApp } from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";

/** Owners, managers, and personal workspaces. Team chat lives in Settings / header. */
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

/** Company owner/manager: Guests panel in the footer for stays + briefings. */
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

/** Lean guest stay app — stay home, company villas, support, deposit bills. */
const guestTabs = [
  { href: "/home", labelKey: "guest.nav.stay" as MessageKey, icon: Home },
  { href: "/villas", labelKey: "guest.nav.villas" as MessageKey, icon: Building2 },
  { href: "/messages", labelKey: "guest.nav.support" as MessageKey, icon: MessageCircle },
  { href: "/bills", labelKey: "guest.nav.bills" as MessageKey, icon: Receipt },
];

export function BottomNav() {
  const pathname = usePathname();
  const data = useData();
  const { t } = useI18n();
  const role = data.profile?.role;
  const isCompanyHost =
    data.orgKind === "company" &&
    (role === "owner" || role === "manager");

  if (!data.ready || !role) {
    return (
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))]"
        aria-hidden
      >
        <ul className="flex w-full max-w-md items-center justify-between gap-1 rounded-full bg-nav px-2 py-2 shadow-[0_16px_40px_rgba(28,28,30,0.28)]">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex-1">
              <div className="mx-auto size-11 rounded-full bg-white/15" />
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  const tabs = isGuestApp(role)
    ? guestTabs
    : isStaffApp(role)
      ? staffTabs
      : isCompanyHost
        ? companyHostTabs
        : mainTabs;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
      <ul className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-full bg-nav px-2 py-2 shadow-[0_16px_40px_rgba(28,28,30,0.28)]">
        {tabs.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const label = t(labelKey);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                title={label}
                className={cn(
                  "mx-auto flex size-11 items-center justify-center rounded-full transition",
                  active ? "bg-white text-ink" : "text-white/70 hover:text-white",
                )}
              >
                <Icon className="size-[1.35rem]" strokeWidth={active ? 2.4 : 2} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
