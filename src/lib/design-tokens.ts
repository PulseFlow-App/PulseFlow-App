/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
/**
 * Horizon design tokens — keep in sync with pulseflow-site/DESIGN.md
 * Prefer CSS vars in UI; this object is for JS (charts, themeColor, SVGs).
 */
export const colors = {
  /** Page canvas — cool white, not warm cream */
  background: "#F5F7FC",
  canvas: "#F5F7FC",
  canvasDeep: "#E3E8F3",
  card: "#FFFFFF",
  /** Logo / CTA orange */
  primary: "#F26A36",
  primaryDark: "#D94E1B",
  primarySoft: "#FFE6D6",
  action: "#F26A36",
  /** Confirmed / paid */
  secondary: "#1FA971",
  secondaryDark: "#157A52",
  secondarySoft: "#FFE6D6",
  success: "#1FA971",
  /** Links and secondary text */
  sky: "#3D4F8A",
  skySoft: "#FFE6D6",
  /** Amber highlight */
  sun: "#FFD95E",
  warning: "#F5A524",
  warningDark: "#946000",
  danger: "#E5484D",
  dangerDark: "#C4232A",
  /** Authority text */
  ink: "#0B1F5C",
  muted: "#3D4F8A",
  nav: "#0B1F5C",
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
    fg: "#0B1F5C",
    soft: "#FFE6D6",
    label: "Occupied",
  },
  available: {
    bg: colors.secondary,
    fg: "#157A52",
    soft: "#E5F6EE",
    label: "Available",
  },
  turnover: {
    bg: colors.sun,
    fg: "#946000",
    soft: "#FFD95E",
    label: "Turnover",
  },
  maintenance: {
    bg: colors.danger,
    fg: "#C4232A",
    soft: "#FFE6D6",
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
