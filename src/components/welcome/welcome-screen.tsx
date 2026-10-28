/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PulseMark } from "@/components/brand/pulse-mark";
import {
  PulseIcon,
  type PulseIconName,
} from "@/components/icons/pulse-icon";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/welcome/bottom-sheet";
import { ThemeIconToggle } from "@/components/welcome/theme-icon-toggle";
import { useI18n } from "@/lib/i18n/provider";
import { useBrandName } from "@/lib/i18n/use-brand-name";
import type { MessageKey } from "@/lib/i18n";
import { trackWelcomeEvent } from "@/lib/welcome/analytics";
import { cn } from "@/lib/utils";

type DemoRole = "owner" | "manager" | "employee" | "guest";
type ChipRole = "owner" | "manager" | "staff" | "guest" | "agent";
type CardId = "live" | "jobs" | "bills" | "lang";

const DEMO_ROLES: { role: DemoRole; chip: ChipRole; labelKey: MessageKey }[] = [
  { role: "owner", chip: "owner", labelKey: "welcome.roleOwner" },
  { role: "manager", chip: "manager", labelKey: "welcome.roleManager" },
  { role: "employee", chip: "staff", labelKey: "welcome.roleStaff" },
  { role: "guest", chip: "guest", labelKey: "welcome.roleGuest" },
];

const CARDS: {
  id: CardId;
  titleKey: MessageKey;
  bodyKey: MessageKey;
  bullets: [MessageKey, MessageKey, MessageKey];
  image: string;
  imageAltKey: MessageKey;
  icon: PulseIconName;
}[] = [
  {
    id: "live",
    titleKey: "welcome.cardLiveTitle",
    bodyKey: "welcome.cardLiveBody",
    bullets: [
      "welcome.cardLiveB1",
      "welcome.cardLiveB2",
      "welcome.cardLiveB3",
    ],
    image: "/welcome/card-live.webp",
    imageAltKey: "welcome.cardLiveTitle",
    icon: "properties",
  },
  {
    id: "jobs",
    titleKey: "welcome.cardJobsTitle",
    bodyKey: "welcome.cardJobsBody",
    bullets: [
      "welcome.cardJobsB1",
      "welcome.cardJobsB2",
      "welcome.cardJobsB3",
    ],
    image: "/welcome/card-jobs.webp",
    imageAltKey: "welcome.cardJobsTitle",
    icon: "jobs",
  },
  {
    id: "bills",
    titleKey: "welcome.cardBillsTitle",
    bodyKey: "welcome.cardBillsBody",
    bullets: [
      "welcome.cardBillsB1",
      "welcome.cardBillsB2",
      "welcome.cardBillsB3",
    ],
    image: "/welcome/card-bills.webp",
    imageAltKey: "welcome.cardBillsTitle",
    icon: "bills",
  },
  {
    id: "lang",
    titleKey: "welcome.cardLangTitle",
    bodyKey: "welcome.cardLangBody",
    bullets: [
      "welcome.cardLangB1",
      "welcome.cardLangB2",
      "welcome.cardLangB3",
    ],
    image: "/welcome/card-language.webp",
    imageAltKey: "welcome.cardLangTitle",
    icon: "globe",
  },
];

const ROLE_LINE: Record<ChipRole, MessageKey> = {
  owner: "welcome.roleLineOwner",
  manager: "welcome.roleLineManager",
  staff: "welcome.roleLineStaff",
  guest: "welcome.roleLineGuest",
  agent: "welcome.roleLineAgent",
};

const ROLE_LABEL: Record<ChipRole, MessageKey> = {
  owner: "welcome.roleOwner",
  manager: "welcome.roleManager",
  staff: "welcome.roleStaff",
  guest: "welcome.roleGuest",
  agent: "welcome.roleAgent",
};

export function WelcomeScreen() {
  const { t } = useI18n();
  const brandName = useBrandName();
  const router = useRouter();
  const [chip, setChip] = useState<ChipRole>("owner");
  const [openCard, setOpenCard] = useState<CardId | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);

  const activeCard = useMemo(
    () => CARDS.find((c) => c.id === openCard) ?? null,
    [openCard],
  );

  const demoForChip = DEMO_ROLES.find((d) => d.chip === chip);

  const openDemo = (role: DemoRole) => {
    trackWelcomeEvent("welcome_demo_pick", { role });
    setDemoOpen(false);
    router.push(`/login?demo=${role === "employee" ? "staff" : role}`);
  };

  return (
    <div
      className="h-dvh overflow-x-hidden overflow-y-auto overscroll-y-contain bg-transparent text-ink"
      style={{
        paddingInline:
          "max(0.75rem, env(safe-area-inset-left)) max(0.75rem, env(safe-area-inset-right))",
      }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <header className="flex flex-wrap items-center gap-x-1.5 gap-y-2 pb-4 sm:gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <PulseMark className="size-9 shrink-0" />
            <span className="hidden font-display text-sm font-bold tracking-tight min-[400px]:inline sm:text-base">
              {brandName}
            </span>
            <span className="sr-only">{brandName}</span>
          </div>
          <LanguageSwitcher variant="inline" />
          <Link
            href="/login"
            className={cn(
              "inline-flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-full px-2.5 sm:px-3",
              "text-sm font-semibold text-ink",
              "hover:bg-canvas-deep",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            )}
          >
            {t("welcome.signIn")}
          </Link>
          <ThemeIconToggle className="shrink-0" />
        </header>

        <main className="flex flex-1 flex-col gap-8">
          <section className="space-y-4">
            <h1 className="font-display text-[clamp(1.45rem,6.2vw,2.35rem)] font-bold leading-[1.15] tracking-tight text-ink max-sm:max-w-[18ch]">
              {t("welcome.title")}
            </h1>
            <p className="max-w-[42ch] text-[0.95rem] leading-relaxed text-muted">
              {t("welcome.subline")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Button
                type="button"
                size="lg"
                className="h-12 w-full min-h-[44px] sm:flex-1"
                onClick={() => {
                  trackWelcomeEvent("welcome_start_free");
                  router.push("/register");
                }}
              >
                {t("welcome.startFree")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="h-12 w-full min-h-[44px] sm:flex-1"
                onClick={() => {
                  trackWelcomeEvent("welcome_see_demo");
                  setDemoOpen(true);
                }}
              >
                {t("welcome.seeDemo")}
              </Button>
            </div>
          </section>

          <section
            aria-label={t("welcome.title")}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {CARDS.map(({ id, titleKey, bodyKey, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  trackWelcomeEvent("welcome_card_open", { card: id });
                  setOpenCard(id);
                }}
                className={cn(
                  "flex max-h-[110px] min-h-[96px] flex-col items-start gap-2 rounded-[1.15rem]",
                  "border border-[var(--color-border)] bg-card p-4 text-start soft-shadow",
                  "transition hover:bg-canvas-deep active:scale-[0.99]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                )}
              >
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-canvas-deep">
                  <PulseIcon name={icon} className="size-5" aria-hidden />
                </span>
                <span className="space-y-0.5">
                  <span className="block font-display text-sm font-bold leading-snug text-ink">
                    {t(titleKey)}
                  </span>
                  <span className="block text-xs leading-snug text-muted">
                    {t(bodyKey)}
                  </span>
                </span>
              </button>
            ))}
          </section>

          <section
            className="space-y-3 text-center sm:text-start"
            aria-label={t("common.role")}
          >
            <div
              role="tablist"
              aria-label={t("common.role")}
              className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1.5"
            >
              {(
                [
                  ["owner", "manager"],
                  ["staff"],
                  ["guest", "agent"],
                ] as const satisfies ChipRole[][]
              ).map((group) => (
                <div
                  key={group.join("-")}
                  className="flex flex-wrap items-center justify-center gap-1.5"
                >
                  {group.map((role) => {
                    const selected = chip === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => {
                          setChip(role);
                          trackWelcomeEvent("welcome_role_chip", { role });
                        }}
                        className={cn(
                          "inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-semibold sm:px-3.5",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                          selected
                            ? "bg-primary text-white shadow-[0_6px_16px_rgba(242,106,54,0.28)]"
                            : "border border-[var(--color-border)] bg-card text-ink hover:bg-canvas-deep",
                        )}
                      >
                        {t(ROLE_LABEL[role])}
                        {role === "agent" ? (
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              selected
                                ? "bg-white/20 text-white"
                                : "bg-sun/25 text-ink",
                            )}
                          >
                            {t("welcome.roleNew")}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <p
              className="mx-auto min-h-[2.75rem] max-w-[36ch] text-center text-sm leading-relaxed text-muted"
              role="status"
            >
              {t(ROLE_LINE[chip])}
            </p>
            {demoForChip ? (
              <button
                type="button"
                onClick={() => openDemo(demoForChip.role)}
                className="mx-auto block text-center text-sm font-semibold text-sky underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("welcome.tryDemo", { role: t(demoForChip.labelKey) })}
              </button>
            ) : null}
          </section>
        </main>

        <footer className="mt-8 border-t border-[var(--color-border)] pt-4 text-center">
          <a
            href="mailto:support@pulseflow.site"
            className="text-sm font-semibold text-sky underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("welcome.support")}
          </a>
        </footer>
      </div>

      <BottomSheet
        open={Boolean(activeCard)}
        title={activeCard ? t(activeCard.titleKey) : ""}
        onClose={() => setOpenCard(null)}
      >
        {activeCard ? (
          <div className="space-y-4">
            <ul className="space-y-2 text-sm leading-relaxed text-ink">
              {activeCard.bullets.map((key) => (
                <li key={key} className="flex gap-2">
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-canvas-deep">
              <Image
                src={activeCard.image}
                alt={t(activeCard.imageAltKey)}
                width={960}
                height={640}
                loading="lazy"
                className="h-auto w-full object-cover"
                sizes="(max-width: 640px) 100vw, 512px"
              />
            </div>
          </div>
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={demoOpen}
        title={t("welcome.demoChooserTitle")}
        onClose={() => setDemoOpen(false)}
      >
        <p className="mb-4 text-sm text-muted">{t("welcome.demoChooserHint")}</p>
        <div className="grid gap-2">
          {DEMO_ROLES.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => openDemo(account.role)}
              className={cn(
                "min-h-[44px] rounded-2xl border border-[var(--color-border)] bg-canvas-deep px-4 py-3 text-start",
                "font-semibold text-ink hover:bg-primary-soft",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              )}
            >
              {t(account.labelKey)}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
