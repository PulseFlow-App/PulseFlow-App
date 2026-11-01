"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ServicesMark } from "@/components/brand/services-mark";
import { PulseIcon, type PulseIconName } from "@/components/icons/pulse-icon";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeIconToggle } from "@/components/welcome/theme-icon-toggle";
import { ProsProvider, usePros } from "@/lib/pros/store";
import { allAreas, areaName } from "@/lib/pros/matching";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function Frame({ children }: { children: React.ReactNode }) {
  const { state, t, setPlace } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const areas = allAreas(state).filter((a) => a.level === "locality" || a.level === "district");
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
      <header className="z-20 shrink-0 border-b border-[var(--color-border)] bg-canvas/95 backdrop-blur">
        <div className={cn("mx-auto flex items-center gap-2 px-4 py-3", wide ? "max-w-3xl" : "max-w-lg")}>
          <Link href={onAppPath ? "/pros" : "/"} className="flex min-w-0 items-center gap-2 text-ink">
            <ServicesMark className="size-11 shrink-0" />
            <span className="font-display text-sm font-semibold leading-tight">
              <span className="block">{nameBreak > 0 ? productName.slice(0, nameBreak) : productName}</span>
              {nameBreak > 0 ? <span className="block">{productName.slice(nameBreak + 1)}</span> : null}
            </span>
          </Link>
          <label className="relative ms-auto inline-flex h-8 max-w-[7rem] min-w-0 items-center">
            <span className="sr-only">{t("place")}</span>
            <select
              className="h-8 w-full appearance-none truncate rounded-full border border-[var(--color-border)] bg-card py-0 pe-6 ps-2 text-xs font-semibold text-ink"
              value={state.placeId ?? ""}
              onChange={(e) => setPlace(e.target.value || null)}
            >
              <option value="">{t("any")}</option>
              {areas
                .filter((area) => area.level === "locality")
                .map((island) => (
                  <optgroup key={island.id} label={areaName(state, island.id, locale)}>
                    <option value={island.id}>{areaName(state, island.id, locale)}</option>
                    {areas
                      .filter((area) => area.parentId === island.id)
                      .map((area) => (
                        <option key={area.id} value={area.id}>
                          {areaName(state, area.id, locale)}
                        </option>
                      ))}
                  </optgroup>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-1.5 size-3.5 text-muted" aria-hidden />
          </label>
          <LanguageSwitcher variant="inline" />
          <ThemeIconToggle />
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
            <p className="mt-8 text-center text-xs text-muted">{t("terms")}</p>
          )}
        </div>
      </main>
      {hideNav ? null : (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <ul className="pointer-events-auto mx-auto flex h-12 w-full max-w-lg items-stretch overflow-hidden rounded-2xl bg-nav px-0.5 shadow-[var(--shadow-nav)]">
            {tabs.map(([publicHref, label, appHref, icon]) => {
              const href = onAppPath ? appHref : publicHref;
              const active = publicHref === "/" ? here === "/" : here.startsWith(publicHref);
              return (
                <li key={publicHref} className="min-w-0 flex-1">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-xl px-0.5",
                      active ? "pf-nav-active" : "text-white/75",
                    )}
                  >
                    <PulseIcon name={icon} surface={active ? "canvas" : "nav"} className="size-5" />
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
