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
import { AppVersionMark } from "@/components/layout/app-version-mark";
import { Button } from "@/components/ui/button";
import { AddToHomeScreenModal } from "@/components/pwa/add-to-home-screen-modal";
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
      className="h-dvh overflow-x-hidden overflow-y-auto overscroll-y-contain bg-pf-page font-pf-sans text-pf-ink"
      style={{
        paddingInline:
          "max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right))",
      }}
    >
      <AddToHomeScreenModal />
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <header className="flex items-center gap-2 pb-6">
          <PulseMark className="size-8 shrink-0 sm:size-9" />
          <span className="min-w-0 truncate text-pf-16 font-bold tracking-[-0.02em]">
            {brandName}
          </span>
          <div className="ms-auto flex shrink-0 items-center gap-1.5">
            <LanguageSwitcher variant="inline" />
            <Link
              href="/login"
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center justify-center rounded-pf-pill px-3",
                "text-pf-14 font-medium text-pf-ink",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600",
              )}
            >
              {t("welcome.signIn")}
            </Link>
            <ThemeIconToggle className="relative z-10 shrink-0" />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-8">
          <section className="space-y-4">
            <h1 className="max-w-[18ch] text-pf-36 font-extrabold leading-[1.05] tracking-[-0.03em] text-pf-ink">
              {t("welcome.title")}
            </h1>
            <p className="max-w-[42ch] text-pf-16 leading-relaxed text-pf-text-secondary">
              {t("welcome.subline")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Button
                type="button"
                size="lg"
                className="w-full sm:flex-1"
                onClick={() => {
                  trackWelcomeEvent("welcome_start_free");
                  router.push("/register");
                }}
              >
                {t("welcome.startFree")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full sm:flex-1"
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
            {CARDS.map(({ id, titleKey, bodyKey, icon }, index) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  trackWelcomeEvent("welcome_card_open", { card: id });
                  setOpenCard(id);
                }}
                className={cn(
                  "flex w-full items-start gap-3 overflow-hidden rounded-pf-card border border-pf-line bg-pf-card px-4 py-4 text-start",
                  "motion-reduce:transform-none active:scale-[0.99]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600",
                  index === 0 && "sm:col-span-2",
                )}
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-pf-control bg-pf-peach-100 text-pf-ink">
                  <PulseIcon name={icon} className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block text-pf-16 font-bold leading-snug text-pf-ink">
                    {t(titleKey)}
                  </span>
                  <span className="block text-pf-14 leading-snug text-pf-text-secondary">
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
                          "inline-flex min-h-11 items-center gap-1.5 rounded-pf-pill px-3 text-pf-14 font-medium sm:px-3.5",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600",
                          selected
                            ? "border border-pf-line bg-pf-peach-100 text-pf-ink"
                            : "border border-pf-line bg-pf-card text-pf-ink",
                        )}
                      >
                        {t(ROLE_LABEL[role])}
                        {role === "agent" ? (
                          <span className="rounded-pf-pill bg-pf-yellow-300 px-2 py-0.5 text-pf-12 font-medium text-pf-warning-ink">
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
              className="mx-auto min-h-11 max-w-[36ch] text-center text-pf-14 leading-relaxed text-pf-text-secondary"
              role="status"
            >
              {t(ROLE_LINE[chip])}
            </p>
            {demoForChip ? (
              <button
                type="button"
                onClick={() => openDemo(demoForChip.role)}
                className="mx-auto inline-flex min-h-11 items-center text-center text-pf-14 font-medium text-pf-navy-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600"
              >
                {t("welcome.tryDemo", { role: t(demoForChip.labelKey) })}
              </button>
            ) : null}
          </section>
        </main>

        <footer className="mt-8 space-y-2 border-t border-pf-line pt-4 text-center">
          <nav
            aria-label={`${t("settings.privacyLink")}, ${t("settings.termsLink")}`}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
          >
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-navy-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600"
            >
              {t("settings.privacyLink")}
            </Link>
            <Link
              href="/terms"
              className="inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-navy-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600"
            >
              {t("settings.termsLink")}
            </Link>
          </nav>
          <a
            href="mailto:support@pulseflow.site"
            className="inline-flex min-h-11 items-center text-pf-14 font-medium text-pf-navy-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600"
          >
            {t("welcome.support")}
          </a>
          <AppVersionMark className="pt-1" />
        </footer>
      </div>

      <BottomSheet
        open={Boolean(activeCard)}
        title={activeCard ? t(activeCard.titleKey) : ""}
        onClose={() => setOpenCard(null)}
      >
        {activeCard ? (
          <div className="space-y-4">
            <ul className="space-y-2 text-pf-16 leading-relaxed text-pf-ink">
              {activeCard.bullets.map((key) => (
                <li key={key} className="flex gap-2">
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-pf-orange-500"
                    aria-hidden
                  />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <div className="overflow-hidden rounded-pf-card border border-pf-line bg-pf-page">
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
        <p className="mb-4 text-pf-14 text-pf-text-secondary">
          {t("welcome.demoChooserHint")}
        </p>
        <div className="grid gap-2">
          {DEMO_ROLES.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => openDemo(account.role)}
              className={cn(
                "min-h-11 rounded-pf-card border border-pf-line bg-pf-page px-4 py-3 text-start",
                "text-pf-16 font-medium text-pf-ink",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600",
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
