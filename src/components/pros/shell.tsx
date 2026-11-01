"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { ServicesMark } from "@/components/brand/services-mark";
import { PulseIcon, type PulseIconName } from "@/components/icons/pulse-icon";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { PlacePicker } from "@/components/pros/place-picker";
import { ThemeIconToggle } from "@/components/welcome/theme-icon-toggle";
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
  const productName = t("productName");
  const nameBreak = productName.lastIndexOf(" ");
  const tabs: [string, string, string, PulseIconName][] = [
    ["/", t("home"), "/pros", "home"],
    ["/find", t("find"), "/pros/find", "search"],
    ["/requests", t("requests"), "/pros/requests", "clipboard"],
  ];
  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden text-ink">
      <header className="z-20 shrink-0 border-b border-[var(--color-border)] bg-canvas/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div
          className={cn(
            "mx-auto px-3 sm:px-4",
            wide ? "max-w-3xl" : "max-w-lg",
            "flex items-center gap-1.5 py-2.5 sm:gap-2 sm:py-3",
          )}
        >
          <div className="flex w-full min-w-0 items-center gap-1.5 sm:gap-2">
            <Link
              href={servicesPath(pathname, "/")}
              className="flex min-w-0 shrink items-center gap-2 overflow-hidden text-ink"
            >
              <ServicesMark className="size-10 shrink-0 sm:size-11" />
              <span className="hidden min-w-0 font-display text-sm font-semibold leading-tight sm:block">
                <span className="block truncate">
                  {nameBreak > 0 ? productName.slice(0, nameBreak) : productName}
                </span>
                {nameBreak > 0 ? (
                  <span className="block truncate">{productName.slice(nameBreak + 1)}</span>
                ) : null}
              </span>
            </Link>
            <PlacePicker />
            <LanguageSwitcher variant="inline" />
            {actor ? (
              <Link
                href={onAppPath ? "/pros/settings" : "/settings"}
                aria-label={t("settings")}
                aria-current={here.startsWith("/settings") ? "page" : undefined}
                className={cn(
                  "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
                  "border border-[var(--color-border)] bg-card text-ink",
                  "hover:bg-canvas-deep",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  "sm:size-8",
                  here.startsWith("/settings") && "text-primary",
                )}
              >
                <Settings className="size-3.5 shrink-0" aria-hidden strokeWidth={2} />
              </Link>
            ) : null}
            <ThemeIconToggle className="size-10 shrink-0 sm:size-8" />
          </div>
        </div>
      </header>
      <main
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain",
          hideNav ? "pb-8" : "pb-[max(5.75rem,calc(4.75rem+env(safe-area-inset-bottom)))]",
        )}
      >
        <div className={cn("mx-auto w-full px-4 py-4", wide ? "max-w-3xl" : "max-w-lg")}>
          {children}
          {here.startsWith("/admin") ? null : (
            <div className="mt-8 space-y-2 text-center">
              <p className="text-xs text-muted">{t("terms")}</p>
              <p className="text-xs">
                <Link href={servicesPath(pathname, "/terms")} className="font-semibold text-primary">
                  {t("termsLink")}
                </Link>
                <span className="text-muted"> · </span>
                <Link href={servicesPath(pathname, "/privacy")} className="font-semibold text-primary">
                  {t("privacyLink")}
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
      {hideNav ? null : (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <ul className="pointer-events-auto mx-auto flex h-12 w-full max-w-lg items-stretch overflow-hidden rounded-2xl bg-nav shadow-[var(--shadow-nav)]">
            {tabs.map(([publicHref, label, appHref, icon], index) => {
              const href = onAppPath ? appHref : publicHref;
              const active = publicHref === "/" ? here === "/" : here.startsWith(publicHref);
              const edge =
                index === 0
                  ? "rounded-s-none rounded-e-xl"
                  : index === tabs.length - 1
                    ? "rounded-e-none rounded-s-xl"
                    : "rounded-xl";
              return (
                <li key={publicHref} className="min-w-0 flex-1">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-full w-full flex-col items-center justify-center gap-0.5 px-0.5",
                      edge,
                      active ? "pf-nav-active" : "text-white/75",
                    )}
                  >
                    <PulseIcon name={icon} surface={active ? "canvas" : "nav"} className="size-[1rem]" />
                    <span className="max-w-full truncate text-[10px] font-bold leading-none">{label}</span>
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
