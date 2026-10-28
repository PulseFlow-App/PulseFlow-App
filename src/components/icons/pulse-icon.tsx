/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
"use client";

import type { SVGProps } from "react";
import { cn } from "@/lib/utils";
import {
  SolarBed,
  SolarBell,
  SolarBillList,
  SolarBook,
  SolarBuildings2,
  SolarCalendarMark,
  SolarChatDots,
  SolarCheckCircle,
  SolarChecklist,
  SolarClipboardCheck,
  SolarClipboardList,
  SolarCupStar,
  SolarDocumentText,
  SolarGlobe,
  SolarHammer,
  SolarHeadphones,
  SolarHome2,
  SolarHomeSmile,
  SolarKeyMinimal,
  SolarLogout,
  SolarMagicWand,
  SolarMagnifier,
  SolarMapPoint,
  SolarMedalStar,
  SolarPen,
  SolarChart2,
  SolarCalendarAdd,
  SolarSettings,
  SolarShield,
  SolarStar,
  SolarStars,
  SolarUserPlus,
  SolarUsersGroup,
  SolarWalletMoney,
  SolarWifiRouter,
} from "@/components/icons/solar";

/**
 * Horizon dual-tone fills — CSS vars so frost/dark remap (globals.css).
 * Soft = calm sky/action wash; ink = structure that follows --color-ink.
 */
export const pulseIconTone = {
  action: "var(--icon-soft-action)",
  sky: "var(--icon-soft-sky)",
  skySoft: "var(--icon-soft-sky)",
  success: "var(--icon-soft-success)",
  sun: "var(--icon-soft-sun)",
  danger: "var(--icon-soft-danger)",
  ink: "var(--icon-ink)",
  white: "var(--icon-soft-white)",
} as const;

export type PulseIconTone = keyof typeof pulseIconTone;

export type PulseIconName =
  | "home"
  | "homeAlt"
  | "properties"
  | "tasks"
  | "guests"
  | "bills"
  | "contacts"
  | "jobs"
  | "chat"
  | "map"
  | "key"
  | "wifi"
  | "settings"
  | "bell"
  | "occupied"
  | "available"
  | "turnover"
  | "maintenance"
  | "wallet"
  | "clipboard"
  | "clipboardCheck"
  | "magic"
  | "search"
  | "star"
  | "trophy"
  | "guide"
  | "globe"
  | "shield"
  | "invite"
  | "support"
  | "document"
  | "edit"
  | "chart"
  | "order"
  | "logout"
  | "medal";

type IconCmp = typeof SolarHomeSmile;

const registry: Record<
  PulseIconName,
  { Icon: IconCmp; soft: PulseIconTone }
> = {
  home: { Icon: SolarHomeSmile, soft: "action" },
  homeAlt: { Icon: SolarHome2, soft: "action" },
  properties: { Icon: SolarBuildings2, soft: "sky" },
  tasks: { Icon: SolarChecklist, soft: "success" },
  guests: { Icon: SolarBed, soft: "sky" },
  bills: { Icon: SolarBillList, soft: "sun" },
  contacts: { Icon: SolarUsersGroup, soft: "action" },
  jobs: { Icon: SolarCalendarMark, soft: "sky" },
  chat: { Icon: SolarChatDots, soft: "action" },
  map: { Icon: SolarMapPoint, soft: "action" },
  key: { Icon: SolarKeyMinimal, soft: "sun" },
  wifi: { Icon: SolarWifiRouter, soft: "sky" },
  settings: { Icon: SolarSettings, soft: "sky" },
  bell: { Icon: SolarBell, soft: "action" },
  occupied: { Icon: SolarBed, soft: "action" },
  available: { Icon: SolarCheckCircle, soft: "success" },
  turnover: { Icon: SolarStars, soft: "sun" },
  maintenance: { Icon: SolarHammer, soft: "danger" },
  wallet: { Icon: SolarWalletMoney, soft: "sun" },
  clipboard: { Icon: SolarClipboardList, soft: "sky" },
  clipboardCheck: { Icon: SolarClipboardCheck, soft: "success" },
  magic: { Icon: SolarMagicWand, soft: "action" },
  search: { Icon: SolarMagnifier, soft: "sky" },
  star: { Icon: SolarStar, soft: "sun" },
  trophy: { Icon: SolarCupStar, soft: "sun" },
  guide: { Icon: SolarBook, soft: "sky" },
  globe: { Icon: SolarGlobe, soft: "sky" },
  shield: { Icon: SolarShield, soft: "success" },
  invite: { Icon: SolarUserPlus, soft: "action" },
  support: { Icon: SolarHeadphones, soft: "sky" },
  document: { Icon: SolarDocumentText, soft: "sky" },
  edit: { Icon: SolarPen, soft: "action" },
  chart: { Icon: SolarChart2, soft: "sun" },
  order: { Icon: SolarCalendarAdd, soft: "action" },
  logout: { Icon: SolarLogout, soft: "danger" },
  medal: { Icon: SolarMedalStar, soft: "sun" },
};

type Surface = "canvas" | "nav" | "inverse";

/**
 * Minimal dual-tone Pulse icons (Iconify Solar Bold Duotone).
 * Soft fill = Horizon accent; ink path = structure.
 */
export function PulseIcon({
  name,
  surface = "canvas",
  soft,
  className,
  ...props
}: {
  name: PulseIconName;
  /** canvas = ink + accent; nav = white + accent; inverse = white + soft white */
  surface?: Surface;
  soft?: PulseIconTone;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "soft" | "ink" | "softOpacity">) {
  const entry = registry[name];
  const Icon = entry.Icon;
  const softTone = soft ?? entry.soft;
  const softColor = pulseIconTone[softTone];
  const ink =
    surface === "canvas" ? pulseIconTone.ink : pulseIconTone.white;
  const softFill =
    surface === "inverse" ? "rgba(255,255,255,0.45)" : softColor;

  return (
    <Icon
      soft={softFill}
      ink={ink}
      softOpacity={surface === "inverse" ? 1 : 0.92}
      className={cn("shrink-0 pf-icon-well", className)}
      {...props}
    />
  );
}
