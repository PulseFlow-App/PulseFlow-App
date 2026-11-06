"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PfIcon, type PfIconName } from "@/components/pros/pf-icons";
import { selectionTick } from "@/components/pros/haptics";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { PlacePicker } from "@/components/pros/place-picker";
import { ThemeIconToggle } from "@/components/welcome/theme-icon-toggle";
import { ProsProvider, usePros } from "@/lib/pros/store";
import type { ServiceDelivery } from "@/lib/pros/delivery";
import { servicesPath } from "@/lib/pros/paths";
import { isHireAccount, isWorkAccount } from "@/lib/pros/intent";
import { isServicesLocale } from "@/lib/pros/paths";
import { LOCALES, LOCALE_META } from "@/lib/i18n";
import { LinkOffer } from "@/components/account/link-offer";
import { AddToHomeScreenModal } from "@/components/pwa/add-to-home-screen-modal";
import { BillingOffer } from "@/components/pros/billing-offer";
import { SupportMail } from "@/components/pros/support-mail";
import { VisitNotice } from "@/components/pros/visit-notice";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const STAFF_LOCALES = ["en", "th"] as const;

function Frame({ children }: { children: React.ReactNode }) {
  const { t, actor, actorReady } = usePros();
  const { locale, setLocale } = useI18n();
  const pathname = usePathname();
  const onAppPath = pathname === "/pros" || pathname.startsWith("/pros/");
  const here = onAppPath ? (pathname === "/pros" ? "/" : pathname.slice("/pros".length)) : pathname;
  const wide = here.startsWith("/admin") || here.startsWith("/profile");
  const hideNav = here.startsWith("/reply") || here.startsWith("/claim");
  const workAccount = actorReady && isWorkAccount(actor);
  const searchAccount = actorReady && isHireAccount(actor);
  useEffect(() => {
    if (!workAccount) return;
    if (locale === "en" || locale === "th") return;
    setLocale("en");
  }, [workAccount, locale, setLocale]);
  const isHome = here === "/explore" || (here === "/" && searchAccount);
  const [incoming, setIncoming] = useState(0);
  const [companyToday, setCompanyToday] = useState(false);
  useEffect(() => {
    if (!actor || actor.id.startsWith("local")) {
      setIncoming(0);
      return;
    }
    let cancelled = false;
    void fetch("/api/services/requests")
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((payload: { requests?: ServiceDelivery[] }) => {
        if (cancelled) return;
        const count = (payload.requests ?? []).filter(
          (row) => row.target_profile_id === actor.id && !row.reply_message,
        ).length;
        setIncoming(count);
      })
      .catch(() => {
        if (!cancelled) setIncoming(0);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, here]);
  useEffect(() => {
    if (!actor || actor.id.startsWith("local")) {
      setCompanyToday(false);
      return;
    }
    let cancelled = false;
    const load = () => {
      void fetch("/api/services/company-tasks", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { tasks: [] }))
        .then((payload: { tasks?: unknown[] }) => {
          if (!cancelled) setCompanyToday((payload.tasks ?? []).length > 0);
        })
        .catch(() => {
          if (!cancelled) setCompanyToday(false);
        });
    };
    load();
    window.addEventListener("account-link", load);
    return () => {
      cancelled = true;
      window.removeEventListener("account-link", load);
    };
  }, [actor]);
  const tabs: [string, string, string, PfIconName][] = [
    ...(companyToday
      ? [["/company", t("companyToday"), "/pros/company", "check"] as [string, string, string, PfIconName]]
      : []),
    ["/", t("home"), "/pros", "home"],
    ["/find", t("find"), "/pros/find", "search"],
    ["/inbox", workAccount ? t("staffOrders") : t("messages"), "/pros/inbox", workAccount ? "check" : "chat"],
    ["/requests", t("requests"), "/pros/requests", "clipboard"],
  ];
  const visibleTabs = tabs.filter(([publicHref]) => {
    if (publicHref === "/company") return true;
    if (workAccount) return publicHref === "/" || publicHref === "/inbox";
    if (searchAccount) return publicHref === "/" || publicHref === "/find" || publicHref === "/requests";
    return publicHref === "/";
  });
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-pf-page font-[family-name:var(--font-pf-sans)] text-pf-ink">
      {isHome ? null : (
      <header className="z-20 shrink-0 border-b border-pf-line bg-pf-page/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div
          className={cn(
            "mx-auto flex items-center gap-2 px-4 py-2",
            wide ? "max-w-3xl" : "max-w-lg",
          )}
        >
          {searchAccount ? <PlacePicker variant="pill" /> : null}
          <div className="min-w-0 flex-1" />
          <LanguageSwitcher variant="code" locales={workAccount ? STAFF_LOCALES : undefined} />
          <ThemeIconToggle className="size-11 shrink-0" />
          {actor ? (
            <Link
              href={onAppPath ? "/pros/settings" : "/settings"}
              aria-label={t("settings")}
              aria-current={here.startsWith("/settings") ? "page" : undefined}
              className="inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pf-navy-900 text-pf-16 font-medium text-[#F5F7FC]"
            >
              {actor.logoUrl ? (
                <img src={actor.logoUrl} alt="" className="size-full object-cover" />
              ) : (
                actor.name.slice(0, 1)
              )}
            </Link>
          ) : (
            <Link
              href={`${onAppPath ? "/pros/start" : "/start"}?mode=sign-in&next=${encodeURIComponent(pathname)}`}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-14 font-medium text-pf-ink"
            >
              {t("signIn")}
            </Link>
          )}
        </div>
      </header>
      )}
      <main
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-pf-page [overflow-anchor:none]",
          hideNav ? "pb-8" : "pb-2",
        )}
      >
        <div className={cn("mx-auto w-full", isHome ? "max-w-lg" : "px-4 py-4", !isHome && (wide ? "max-w-3xl" : "max-w-lg"))}>
          {hideNav ? null : <LinkOffer app="services" />}
          {searchAccount ? <BillingOffer /> : null}
          {searchAccount ? <VisitNotice /> : null}
          {children}
          {isHome || here.startsWith("/admin") ? null : (
            <div className="mt-8 space-y-2 text-center">
              <p className="text-pf-12 text-pf-slate-ink">{t("terms")}</p>
              <p className="flex flex-wrap justify-center gap-4 text-pf-14">
                <Link href={servicesPath(pathname, "/terms")} className="font-medium text-pf-text-secondary">
                  {t("termsLink")}
                </Link>
                <Link href={servicesPath(pathname, "/privacy")} className="font-medium text-pf-text-secondary">
                  {t("privacyLink")}
                </Link>
              </p>
              <SupportMail locale={locale} />
              {!workAccount && (here === "/" || isServicesLocale(here.slice(1))) ? (
                <nav aria-label={t("languages")} className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                  {LOCALES.map((code) => (
                    <Link
                      key={code}
                      href={servicesPath(pathname, `/${code}`)}
                      hrefLang={code}
                      lang={code}
                      className="text-pf-14 font-medium text-pf-text-secondary"
                    >
                      {LOCALE_META[code].native}
                    </Link>
                  ))}
                </nav>
              ) : null}
            </div>
          )}
        </div>
      </main>
      {hideNav ? null : (
        <nav className="z-20 shrink-0 border-t border-pf-line bg-[color-mix(in_srgb,var(--pf-card)_78%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
          <ul className="mx-auto flex w-full max-w-lg items-stretch">
            {visibleTabs.map(([publicHref, label, appHref, icon]) => {
              const href = onAppPath ? appHref : publicHref;
              const active = publicHref === "/" ? here === "/" : here.startsWith(publicHref);
              return (
                <li key={publicHref} className="min-w-0 flex-1">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => selectionTick()}
                    className={cn(
                      "flex min-h-11 w-full flex-col items-center justify-center gap-0.5 px-1 py-1 font-[family-name:var(--font-pf-chrome)]",
                      active ? "text-pf-ink" : "text-pf-text-tertiary",
                    )}
                  >
                    <span className="relative">
                      <PfIcon name={icon} tone={active ? "active" : "muted"} className="size-5" />
                      {publicHref === "/inbox" && incoming > 0 ? (
                        <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-pf-pill bg-pf-orange-500 px-1 text-[10px] font-medium text-white">
                          {incoming > 9 ? "9+" : incoming}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-center text-[11px] font-medium leading-tight">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      <AddToHomeScreenModal />
    </div>
  );
}

export function ProsShell({ children }: { children: React.ReactNode }) {
  return (
    <ProsProvider>
      <Frame>{children}</Frame>
    </ProsProvider>
  );
}
