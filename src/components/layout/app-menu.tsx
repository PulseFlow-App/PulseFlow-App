"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
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

type MenuLink = {
  href: string;
  label: string;
  icon: typeof Star;
  external?: boolean;
};

type MenuSection = {
  id: string;
  label?: string;
  quiet?: boolean;
  links: MenuLink[];
};

const ROW =
  "flex w-full items-center gap-3 px-3 py-[14px] font-semibold text-ink transition hover:bg-white/70";

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
      icon: Users,
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
      quiet: true,
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
            <nav className="flex-1 overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={index > 0 ? "border-t border-[#EDE8E0]" : undefined}
                >
                  {section.label ? (
                    <p className="font-display px-3 pb-0.5 pt-3 text-[11px] font-bold uppercase tracking-wide text-muted">
                      {section.label}
                    </p>
                  ) : null}
                  <ul>
                    {section.links.map((link) => (
                      <li key={link.href + link.label}>
                        <MenuRow
                          link={link}
                          quiet={section.quiet}
                          onNavigate={() => setOpen(false)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="border-t border-[#EDE8E0]">
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex w-full items-center px-3 py-[14px] text-start text-[15px] font-semibold text-[#c0392b]"
                >
                  {t("settings.signOut")}
                </button>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MenuRow({
  link,
  quiet,
  onNavigate,
}: {
  link: MenuLink;
  quiet?: boolean;
  onNavigate: () => void;
}) {
  const Icon = link.icon;
  const className = cn(
    ROW,
    quiet ? "text-[14px]" : "text-[15px]",
  );
  const iconClass = cn(
    "shrink-0 text-muted",
    quiet ? "size-3.5" : "size-4",
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target={link.href.startsWith("http") ? "_blank" : undefined}
        rel={link.href.startsWith("http") ? "noreferrer" : undefined}
        onClick={onNavigate}
        className={className}
      >
        <Icon className={iconClass} />
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} onClick={onNavigate} className={className}>
      <Icon className={iconClass} />
      {link.label}
    </Link>
  );
}
