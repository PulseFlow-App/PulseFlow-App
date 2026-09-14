"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  ClipboardList,
  FileText,
  Globe,
  LifeBuoy,
  Menu,
  Shield,
  Star,
  Trophy,
  UserPlus,
  Users,
  X,
  Search,
  CalendarClock,
  LogOut,
} from "lucide-react";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import {
  canInviteAnyone,
  canUseTeamReputation,
  isGuestApp,
} from "@/lib/roles";
import { legalAudienceFromRole, legalPageHref } from "@/lib/legal/audiences";
import { canUseManagerReporting } from "@/lib/billing/reporting";
import { isDemoMode, createClient } from "@/lib/supabase/client";
import { demoLogout } from "@/lib/demo/store";
import { brand } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { labelRole } from "@/lib/i18n/labels";

type MenuLink = {
  href: string;
  label: string;
  icon: typeof Star;
  external?: boolean;
};

type MenuSection = {
  id: string;
  label?: string;
  links: MenuLink[];
};

export function AppMenuButton() {
  const data = useData();
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const profile = data.profile;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!profile) return null;

  const isGuest = isGuestApp(profile.role);
  const isCompany = data.orgKind === "company";
  const isOpsLead =
    isCompany && (profile.role === "owner" || profile.role === "manager");
  const showReputation = !isGuest && canUseTeamReputation(data.orgKind);
  const showReports =
    !isGuest &&
    canUseManagerReporting({
      role: profile.role,
      orgKind: data.orgKind,
      organization: data.organization,
    });
  const showInvites = !isGuest && canInviteAnyone(profile.role);
  const initial = (profile.full_name.trim().charAt(0) || "?").toUpperCase();

  const primary: MenuLink[] = [];
  if (showReputation) {
    primary.push({
      href: "/endorsements",
      label: t("nav.endorsements"),
      icon: Star,
    });
    primary.push({
      href: "/leaderboard",
      label: t("nav.leaderboard"),
      icon: Trophy,
    });
  }
  if (showReports) {
    primary.push({
      href: "/reports",
      label: t("nav.reports"),
      icon: ClipboardList,
    });
  }
  if (isOpsLead) {
    primary.push({
      href: "/talent",
      label: t("nav.talent"),
      icon: Search,
    });
  }

  const manage: MenuLink[] = [];
  if (isOpsLead) {
    manage.push({
      href: "/contacts",
      label: t("nav.contacts"),
      icon: Users,
    });
    manage.push({
      href: "/date-requests",
      label: t("nav.dateRequests"),
      icon: CalendarClock,
    });
    manage.push({
      href: "/company",
      label: t("nav.company"),
      icon: Building2,
    });
  }
  if (showInvites) {
    manage.push({
      href: "/invites",
      label: t("nav.invites"),
      icon: UserPlus,
    });
  }
  if (!isGuest && profile.role !== "owner") {
    manage.push({
      href: "/settings#talent-profile",
      label: t("talent.settingsTitle"),
      icon: Search,
    });
  }

  const guideHref =
    profile.role === "guest"
      ? "https://www.pulseflow.site/guests"
      : profile.role === "manager"
        ? "https://www.pulseflow.site/managers"
        : profile.role === "owner"
          ? "https://www.pulseflow.site/owners"
          : "https://www.pulseflow.site/staff";
  const legalAudience = legalAudienceFromRole(profile.role);

  const account: MenuLink[] = [
    {
      href: guideHref,
      label: t("settings.userGuide"),
      icon: BookOpen,
      external: true,
    },
    {
      href: "https://www.pulseflow.site",
      label: t("settings.website"),
      icon: Globe,
      external: true,
    },
  ];
  if (!isGuest) {
    account.push({
      href: `mailto:${brand.supportEmail}`,
      label: t("settings.supportLink"),
      icon: LifeBuoy,
      external: true,
    });
  }
  account.push({
    href: legalPageHref("/terms", legalAudience),
    label: t("settings.termsLink"),
    icon: FileText,
  });
  account.push({
    href: legalPageHref("/privacy", legalAudience),
    label: t("settings.privacyLink"),
    icon: Shield,
  });

  const sections: MenuSection[] = [
    { id: "primary", links: primary },
    { id: "manage", label: t("nav.menuManage"), links: manage },
    {
      id: "account",
      label: t("nav.menuAccount"),
      links: account,
    },
  ].filter((section) => section.links.length > 0);

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
        className="flex size-8 items-center justify-center text-ink/85 transition hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={t("nav.menu")}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Menu className="size-4" strokeWidth={1.9} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] md:bg-ink/25">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 md:bg-transparent"
            aria-label={t("common.close")}
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "pf-sheet absolute inset-y-0 right-0 flex w-full max-w-[22rem] flex-col",
              "border-l border-[var(--color-border)] bg-card shadow-[var(--shadow-lift)]",
              "pt-[max(0.75rem,env(safe-area-inset-top))]",
              "pb-[max(1rem,env(safe-area-inset-bottom))]",
              "overscroll-contain animate-rise",
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="flex items-center justify-between gap-3 px-4 pb-3">
              <p id={titleId} className="type-title text-[1.25rem]">
                {t("nav.menu")}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-9 shrink-0 items-center justify-center text-ink/80 transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label={t("common.close")}
              >
                <X className="size-[1.15rem]" strokeWidth={1.85} />
              </button>
            </div>

            <div className="mx-4 mb-3 flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-sand px-3 py-3">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-extrabold text-white"
                aria-hidden
              >
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-ink">
                  {profile.full_name}
                </p>
                <p className="type-meta truncate">
                  {isCompany
                    ? `${labelRole(t, profile.role)} · ${data.orgName}`
                    : data.orgName}
                </p>
              </div>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3">
              {sections.map((section) => (
                <div key={section.id} className="mb-3">
                  {section.label ? (
                    <p className="type-meta mb-1.5 px-2 pt-1 uppercase tracking-[0.06em]">
                      {section.label}
                    </p>
                  ) : null}
                  <ul className="space-y-1">
                    {section.links.map((link) => (
                      <li key={link.href + link.label}>
                        <MenuRow
                          link={link}
                          onNavigate={() => setOpen(false)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="mt-auto border-t border-[var(--color-border)] px-3 pt-3">
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-bold text-danger transition hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
              >
                <LogOut className="size-4 shrink-0" strokeWidth={2.2} />
                {t("settings.signOut")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenuRow({
  link,
  onNavigate,
}: {
  link: MenuLink;
  onNavigate: () => void;
}) {
  const Icon = link.icon;
  const className =
    "flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-[0.9375rem] font-semibold text-ink transition hover:bg-primary-soft hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

  if (link.external) {
    return (
      <a
        href={link.href}
        target={link.href.startsWith("http") ? "_blank" : undefined}
        rel={link.href.startsWith("http") ? "noreferrer" : undefined}
        onClick={onNavigate}
        className={className}
      >
        <Icon className="size-5 shrink-0 text-ink/70" strokeWidth={1.9} />
        <span className="truncate">{link.label}</span>
      </a>
    );
  }

  return (
    <Link href={link.href} onClick={onNavigate} className={className}>
      <Icon className="size-5 shrink-0 text-ink/70" strokeWidth={1.9} />
      <span className="truncate">{link.label}</span>
    </Link>
  );
}
