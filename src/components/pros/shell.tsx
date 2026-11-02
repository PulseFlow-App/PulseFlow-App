"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PfIcon, type PfIconName } from "@/components/pros/pf-icons";
import { selectionTick } from "@/components/pros/haptics";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { PlacePicker } from "@/components/pros/place-picker";
import { ThemeIconToggle } from "@/components/welcome/theme-icon-toggle";
import { isServicesWorker } from "@/lib/pros/join";
import { ProsProvider, usePros } from "@/lib/pros/store";
import { servicesPath } from "@/lib/pros/paths";
import { cn } from "@/lib/utils";

function Frame({ children }: { children: React.ReactNode }) {
  const { t, actor } = usePros();
  const pathname = usePathname();
  const onAppPath = pathname === "/pros" || pathname.startsWith("/pros/");
  const here = onAppPath ? (pathname === "/pros" ? "/" : pathname.slice("/pros".length)) : pathname;
  const wide = here.startsWith("/admin") || here.startsWith("/profile");
  const hideNav = here.startsWith("/reply") || here.startsWith("/claim");
  const isHome = here === "/";
  const [worker, setWorker] = useState(false);
  useEffect(() => {
    setWorker(Boolean(actor) && isServicesWorker());
  }, [actor]);
  const tabs: [string, string, string, PfIconName][] = worker
    ? [
        ["/", t("home"), "/pros", "home"],
        ["/inbox", t("inbox"), "/pros/inbox", "clipboard"],
        ["/find", t("find"), "/pros/find", "search"],
      ]
    : [
        ["/", t("home"), "/pros", "home"],
        ["/find", t("find"), "/pros/find", "search"],
        ["/inbox", t("messages"), "/pros/inbox", "chat"],
        ["/requests", t("requests"), "/pros/requests", "clipboard"],
      ];
  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-pf-page font-[family-name:var(--font-pf-sans)] text-pf-ink">
      {isHome ? null : (
      <header className="z-20 shrink-0 border-b border-pf-line bg-pf-page/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div
          className={cn(
            "mx-auto flex items-center gap-2 px-4 py-2",
            wide ? "max-w-3xl" : "max-w-lg",
          )}
        >
          <PlacePicker variant="pill" />
          <div className="min-w-0 flex-1" />
          <LanguageSwitcher variant="code" />
          <ThemeIconToggle className="size-11 shrink-0" />
          <Link
            href={actor ? (onAppPath ? "/pros/settings" : "/settings") : `${onAppPath ? "/pros/start" : "/start"}?mode=sign-in&next=${encodeURIComponent(pathname)}`}
            aria-label={actor ? t("settings") : t("signIn")}
            aria-current={here.startsWith("/settings") ? "page" : undefined}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-pf-navy-900 text-pf-16 font-medium text-[#F5F7FC]"
          >
            {actor ? actor.name.slice(0, 1) : <PfIcon name="person" tone="onNavy" className="size-5" />}
          </Link>
        </div>
      </header>
      )}
      <main
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-pf-page",
          hideNav ? "pb-8" : "pb-2",
        )}
      >
        <div className={cn("mx-auto w-full", isHome ? "max-w-lg" : "px-4 py-4", !isHome && (wide ? "max-w-3xl" : "max-w-lg"))}>
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
            </div>
          )}
        </div>
      </main>
      {hideNav ? null : (
        <nav className="z-20 shrink-0 border-t border-pf-line bg-[color-mix(in_srgb,var(--pf-card)_78%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
          <ul className="mx-auto flex w-full max-w-lg items-stretch">
            {tabs.map(([publicHref, label, appHref, icon]) => {
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
                    <PfIcon name={icon} tone={active ? "active" : "muted"} className="size-5" />
                    <span className="text-center text-[11px] font-medium leading-tight">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
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
