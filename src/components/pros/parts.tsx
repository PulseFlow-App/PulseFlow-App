"use client";

import { useEffect, useState } from "react";
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
  SolarHomeSmile,
  SolarKeyMinimal,
  SolarLeaf,
  SolarPaintRoller,
  SolarStars,
  SolarSwimming,
  SolarTrashBin,
  SolarTuning,
  SolarUsersGroup,
  SolarWaterdrop,
  SolarWidget,
  SolarWifiRouter,
  SolarWind,
} from "@/components/icons/solar";
import { usePros } from "@/lib/pros/store";
import { categoryName, reviewAverage } from "@/lib/pros/matching";
import type { ProProfile } from "@/lib/pros/types";
import { useI18n } from "@/lib/i18n/provider";
import { useLocalizedText } from "@/lib/translate/use-localized-content";

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
  users: SolarUsersGroup,
  home: SolarHomeSmile,
  more: SolarWidget,
} as const;

export function CategoryIcon({
  name,
  className,
  tone = "sky",
}: {
  name: string;
  className?: string;
  /** Home tiles use brand orange. Other screens keep the sky tone. */
  tone?: "sky" | "action";
}) {
  const Icon = TRADE_ICONS[name as keyof typeof TRADE_ICONS] ?? SolarStars;
  return (
    <Icon
      soft={tone === "action" ? pulseIconTone.action : pulseIconTone.sky}
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
    <div className="space-y-3 rounded-[20px] border border-pf-line bg-pf-card p-4">
      <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("signInToSee")}</p>
      <div className="flex flex-col gap-2">
        <Link
          href={pathname.startsWith("/pros") ? "/pros/register?track=customer" : "/register?track=customer"}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-pf-orange-500 px-4 text-pf-16 font-medium text-white active:bg-pf-orange-700"
        >
          {t("signUp")}
        </Link>
        <Link
          href={`${start}?mode=sign-in&next=${encodeURIComponent(next)}`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-pf-line bg-pf-card px-4 text-pf-16 font-medium text-pf-ink"
        >
          {t("signIn")}
        </Link>
      </div>
    </div>
  );
}

export function ProCard({
  pro,
  compact = false,
  reveal = false,
}: {
  pro: ProProfile;
  compact?: boolean;
  /** Keep the name readable. Used for the assistant suggestion before an account. */
  reveal?: boolean;
}) {
  const { state, actor, t } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const rating = reviewAverage(state.reviews, pro.id);
  const trade = categoryName(state, pro.categoryIds[0] ?? null, locale);
  const onAppPath = pathname === "/pros" || pathname.startsWith("/pros/");
  const profilePath = onAppPath ? `/pros/p/${pro.id}` : `/p/${pro.id}`;
  const guest = !reveal && !actor;
  const href = guest ? (onAppPath ? "/pros/register?track=customer" : "/register?track=customer") : profilePath;
  const veil = guest ? "select-none blur-[6px]" : undefined;
  return (
    <Link
      href={href}
      aria-label={guest ? t("signInToSee") : undefined}
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-[20px] border border-pf-line bg-pf-card p-3",
        compact && "max-w-full",
      )}
    >
      <span className={cn("flex min-w-0 flex-1 items-center gap-3", veil)} aria-hidden={guest || undefined}>
        <span
          role={pro.photoUrl ? undefined : "img"}
          aria-label={pro.photoUrl ? undefined : "koh-phangan-tradesperson"}
          className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pf-peach-100 text-pf-18 font-medium text-pf-ink"
        >
          {pro.photoUrl ? (
            <img src={pro.photoUrl} alt="" className="size-full object-cover" />
          ) : (
            pro.name.slice(0, 1)
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-pf-16 font-medium text-pf-ink">{pro.name}</span>
          <span className="block truncate text-pf-14 text-pf-text-secondary">
            {[trade || t("position"), ...(pro.tags ?? []).slice(0, 3)].filter(Boolean).join(" · ")}
          </span>
          <span className="mt-1 block text-pf-12 text-pf-slate-ink">
            {rating == null ? t("noReviews") : rating.toFixed(1)}
          </span>
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
  const saved = translations[locale];
  const needs = !saved && originalLocale !== locale && text.trim().length > 0;
  const { display } = useLocalizedText(needs ? text : "");
  const shown = saved || (needs ? display || text : text);
  const [originalOpen, setOriginalOpen] = useState(false);
  const changed = shown.trim() !== text.trim();
  useEffect(() => {
    if (needs && changed && display && !translations[locale]) onSave(locale, display);
  }, [changed, display, locale, needs, onSave, text, translations]);
  return (
    <div className="space-y-1">
      <p className="whitespace-pre-wrap text-pf-16 text-pf-ink">{shown}</p>
      {changed ? (
        <button
          type="button"
          className="min-h-11 text-pf-14 font-medium text-pf-text-secondary"
          onClick={() => setOriginalOpen((open) => !open)}
        >
          {t("showOriginal")}
        </button>
      ) : null}
      {originalOpen ? <p className="whitespace-pre-wrap text-pf-14 text-pf-text-secondary">{text}</p> : null}
    </div>
  );
}

/** Read an image as a data URL. Prefer prepareVillaPhotoFile first for phone camera files. */
export async function readPhoto(file: File) {
  if (!file.type.startsWith("image/") && file.type !== "") return null;
  // Phone camera files are often 3–12 MB before resize.
  if (file.size > 16_000_000) return null;
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return data.length > 8_000_000 ? null : data;
}
