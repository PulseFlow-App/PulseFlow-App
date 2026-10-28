/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
/**
 * Horizon design tokens — keep in sync with pulseflow-site/DESIGN.md
 * Prefer CSS vars in UI; this object is for JS (charts, themeColor, SVGs).
 */
export const colors = {
  /** Page canvas — cool white, not warm cream */
  background: "#F5FAFC",
  canvas: "#F5FAFC",
  canvasDeep: "#E8F4F8",
  card: "#FFFFFF",
  /** Logo / CTA orange */
  primary: "#F26A36",
  primaryDark: "#D94E1B",
  primarySoft: "#FFE0D4",
  action: "#F26A36",
  /** Confirmed / paid */
  secondary: "#2A9D8F",
  secondaryDark: "#1F7A6F",
  secondarySoft: "#D4F0EC",
  success: "#2A9D8F",
  /** Links, info, focus */
  sky: "#219EBC",
  skySoft: "#8ECAE6",
  /** Amber highlight / Pro */
  sun: "#FFB703",
  warning: "#FFB703",
  warningDark: "#B37F00",
  danger: "#E63946",
  dangerDark: "#B02A35",
  /** Authority text */
  ink: "#023047",
  muted: "#5A6D78",
  nav: "#023047",
  white: "#FFFFFF",
  /** @deprecated Horizon has no purple — alias to sky soft for old call sites */
  lavender: "#8ECAE6",
  lavenderSoft: "#E8F4F8",
} as const;

export type VillaStatus = "available" | "occupied" | "turnover" | "maintenance";
export type CleaningStatus = "not_needed" | "in_progress" | "done";
export type TaskPriority = "normal" | "urgent";
export type TaskStatus = "open" | "pending_verify" | "done";
export type BillStatus = "pending" | "paid";
export type BillCategory =
  | "cleaning"
  | "maintenance"
  | "utilities"
  | "supplies"
  | "transport"
  | "pool"
  | "garden"
  | "staff"
  | "other";

export const BILL_CATEGORIES: BillCategory[] = [
  "cleaning",
  "maintenance",
  "utilities",
  "supplies",
  "transport",
  "pool",
  "garden",
  "staff",
  "other",
];

export type Messenger = "whatsapp" | "line" | "telegram" | "none";
export type ContactMessengerKind = "whatsapp" | "line" | "telegram";
export type UserRole = "owner" | "manager" | "cleaner" | "staff" | "guest";
export type OrgKind = "personal" | "company";

export const statusColors: Record<
  VillaStatus,
  { bg: string; fg: string; soft: string; label: string }
> = {
  occupied: {
    bg: colors.primary,
    fg: colors.primaryDark,
    soft: colors.primarySoft,
    label: "Occupied",
  },
  available: {
    bg: colors.secondary,
    fg: colors.secondaryDark,
    soft: colors.secondarySoft,
    label: "Available",
  },
  turnover: {
    bg: colors.sun,
    fg: colors.warningDark,
    soft: "#FFF3CC",
    label: "Turnover",
  },
  maintenance: {
    bg: colors.danger,
    fg: colors.dangerDark,
    soft: "#FDE4E1",
    label: "Maintenance",
  },
};

export const brand = {
  name: "Pulse Flow",
  tagline: "The pulse of your rental operations",
  description:
    "The pulse of your rental operations. Property status, tasks, contacts, and bills for owners and on-site managers, in one place.",
  supportEmail: "support@pulseflow.site",
} as const;
