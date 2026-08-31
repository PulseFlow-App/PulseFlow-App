"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Globe,
  LifeBuoy,
  LogOut,
  Menu,
  Star,
  Trophy,
  UserPlus,
  Users,
  X,
  Search,
  CalendarClock,
} from "lucide-react";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import {
  canInviteAnyone,
  canUseTeamReputation,
  isGuestApp,
} from "@/lib/roles";
import { canUseManagerReporting } from "@/lib/billing/reporting";
import { isDemoMode, createClient } from "@/lib/supabase/client";
import { demoLogout } from "@/lib/demo/store";
import { brand } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type MenuLink = {
  href: string;
  label: string;
  icon: typeof Star;
  external?: boolean;
};

export function AppMenuButton() {
  const data = useData();
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const profile = data.profile;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!profile) return null;

  const isGuest = isGuestApp(profile.role);
  const isCompany = data.orgKind === "company";
  const showReputation = !isGuest && canUseTeamReputation(data.orgKind);
  const showReports =
    !isGuest &&
    canUseManagerReporting({
      role: profile.role,
      orgKind: data.orgKind,
      organization: data.organization,
    });
  const showInvites = !isGuest && canInviteAnyone(profile.role);

  const links: MenuLink[] = [];
  if (showReputation) {
    links.push({
      href: "/endorsements",
      label: t("nav.endorsements"),
      icon: Star,
    });
    links.push({
      href: "/leaderboard",
      label: t("nav.leaderboard"),
      icon: Trophy,
    });
  }
  if (showReports) {
    links.push({
      href: "/reports",
      label: t("nav.reports"),
      icon: ClipboardList,
    });
  }
  if (isCompany && (profile.role === "owner" || profile.role === "manager")) {
    links.push({
      href: "/talent",
      label: t("nav.talent"),
      icon: Search,
    });
  }
  if (isCompany && (profile.role === "owner" || profile.role === "manager")) {
    links.push({
      href: "/contacts",
      label: t("nav.contacts"),
      icon: Users,
    });
    links.push({
      href: "/date-requests",
      label: t("nav.dateRequests"),
      icon: CalendarClock,
    });
  }
  if (isCompany && (profile.role === "owner" || profile.role === "manager")) {
    links.push({
      href: "/company",
      label: t("nav.company"),
      icon: Users,
    });
  }
  if (showInvites) {
    links.push({
      href: "/invites",
      label: t("nav.invites"),
      icon: UserPlus,
    });
  }
  if (!isGuest && profile.role !== "owner") {
    links.push({
      href: "/settings#talent-profile",
      label: t("talent.settingsTitle"),
      icon: Search,
    });
  }
  links.push({
    href: "https://pulseflow.site",
    label: t("settings.website"),
    icon: Globe,
    external: true,
  });
  links.push({
    href: `mailto:${brand.supportEmail}`,
    label: t("settings.supportLink"),
    icon: LifeBuoy,
    external: true,
  });

  const signOut = async () => {
    setOpen(false);
    if (isDemoMode()) {
      demoLogout();
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-full bg-white text-ink soft-shadow"
        aria-label={t("nav.menu")}
      >
        <Menu className="size-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label={t("common.close")}
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 top-0 flex h-full w-[min(20rem,88vw)] flex-col bg-sand shadow-xl",
              "animate-rise pt-[max(0.75rem,env(safe-area-inset-top))]",
            )}
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.menu")}
          >
            <div className="flex items-center justify-between px-4 pb-3">
              <p className="font-display text-lg font-bold text-ink">
                {t("nav.menu")}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-full bg-white text-ink soft-shadow"
                aria-label={t("common.close")}
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 pb-8">
              <ul className="space-y-1">
                {links.map(({ href, label, icon: Icon, external }) => (
                  <li key={href + label}>
                    {external ? (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={
                          href.startsWith("http") ? "noreferrer" : undefined
                        }
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-ink transition hover:bg-white"
                      >
                        <Icon className="size-4 shrink-0 text-muted" />
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-ink transition hover:bg-white"
                      >
                        <Icon className="size-4 shrink-0 text-muted" />
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-danger transition hover:bg-white"
                  >
                    <LogOut className="size-4 shrink-0" />
                    {t("settings.signOut")}
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
