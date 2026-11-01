"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { pulseIconTone } from "@/components/icons/pulse-icon";
import {
  SolarBolt,
  SolarBroom,
  SolarBug,
  SolarBuildings2,
  SolarDelivery,
  SolarFridge,
  SolarHammer,
  SolarKeyMinimal,
  SolarLeaf,
  SolarPaintRoller,
  SolarStars,
  SolarSwimming,
  SolarTrashBin,
  SolarTuning,
  SolarWaterdrop,
  SolarWidget,
  SolarWifiRouter,
  SolarWind,
} from "@/components/icons/solar";
import { usePros } from "@/lib/pros/store";
import { categoryName, reviewAverage } from "@/lib/pros/matching";
import type { ProProfile } from "@/lib/pros/types";
import { fetchTranslation } from "@/lib/translate/client";
import { useI18n } from "@/lib/i18n/provider";

const TRADE_ICONS = {
  wind: SolarWind,
  droplets: SolarWaterdrop,
  zap: SolarBolt,
  wrench: SolarTuning,
  sparkles: SolarBroom,
  waves: SolarSwimming,
  trees: SolarLeaf,
  paintbrush: SolarPaintRoller,
  hammer: SolarHammer,
  "hard-hat": SolarBuildings2,
  refrigerator: SolarFridge,
  bug: SolarBug,
  "glass-water": SolarWaterdrop,
  wifi: SolarWifiRouter,
  key: SolarKeyMinimal,
  trash: SolarTrashBin,
  truck: SolarDelivery,
  more: SolarWidget,
} as const;

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = TRADE_ICONS[name as keyof typeof TRADE_ICONS] ?? SolarStars;
  return (
    <Icon
      soft={pulseIconTone.sky}
      ink={pulseIconTone.ink}
      softOpacity={0.9}
      className={cn("pf-icon-well shrink-0", className)}
      aria-hidden
    />
  );
}

export function RequireUser({
  children,
  account = "services",
}: {
  children: React.ReactNode;
  account?: "services" | "app";
}) {
  const { actor, actorReady } = usePros();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!actorReady || actor) return;
    const next = `${pathname}${window.location.search}`;
    if (account === "app") {
      const appPath = pathname === "/pros" || pathname.startsWith("/pros/")
        ? pathname
        : pathname === "/"
          ? "/pros"
          : `/pros${pathname}`;
      router.replace(`/login?next=${encodeURIComponent(`${appPath}${window.location.search}`)}`);
      return;
    }
    const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";
    router.replace(`${start}?next=${encodeURIComponent(next)}`);
  }, [account, actor, actorReady, pathname, router]);
  if (!actorReady || !actor) return null;
  return children;
}

export function ServicesAccountGate({ next }: { next: string }) {
  const { t } = usePros();
  const pathname = usePathname();
  const start = pathname.startsWith("/pros") ? "/pros/start" : "/start";
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-card p-4">
      <h2 className="font-display text-lg font-semibold text-ink">{t("trialTitle")}</h2>
      <p className="text-sm text-muted">{t("trialBody")}</p>
      <Link
        href={`${start}?next=${encodeURIComponent(next)}`}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-pill)] bg-primary px-4 text-sm font-semibold text-white"
      >
        {t("createServicesAccount")}
      </Link>
    </div>
  );
}

export function ProCard({ pro }: { pro: ProProfile }) {
  const { state, t } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const rating = reviewAverage(state.reviews, pro.id);
  const trade = categoryName(state, pro.categoryIds[0] ?? null, locale);
  const href = pathname.startsWith("/pros") ? `/pros/p/${pro.id}` : `/p/${pro.id}`;
  return (
    <Link
      href={href}
      className="flex min-h-16 items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-card p-3 soft-shadow"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-canvas-deep font-display text-lg text-ink">
        {pro.name.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{pro.name}</span>
        <span className="block truncate text-sm text-muted">{trade || t("position")}</span>
        <span className="mt-1 block text-xs text-ink/70">
          {rating == null ? t("noReviews") : rating.toFixed(1)}
        </span>
      </span>
    </Link>
  );
}

export function OriginalText({
  text,
  locale: originalLocale,
  translations,
  onSave,
}: {
  text: string;
  locale: string;
  translations: Record<string, string>;
  onSave: (locale: string, text: string) => void;
}) {
  const { locale } = useI18n();
  const { t } = usePros();
  const translated = translations[locale];
  const showTranslate = originalLocale !== locale && text.trim().length > 0;
  return (
    <div className="space-y-1">
      <p className="whitespace-pre-wrap text-sm text-ink">{translated || text}</p>
      {showTranslate ? (
        <div className="flex flex-wrap gap-3 text-xs">
          {translated ? <span className="text-muted">{t("originalKept")}</span> : null}
          <button
            type="button"
            className="font-semibold text-sky"
            onClick={() => {
              if (translated) return;
              void fetchTranslation(text, locale).then((next) => {
                if (next) onSave(locale, next);
              });
            }}
          >
            {translated ? text : t("translate")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export async function readPhoto(file: File) {
  if (!file.type.startsWith("image/") || file.size > 1_400_000) return null;
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return data.length > 1_800_000 ? null : data;
}
