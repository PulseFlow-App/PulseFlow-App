export const colors = {
  background: "#FDF7F2",
  card: "#FFFFFF",
  primary: "#F26A36",
  primaryDark: "#D94E1B",
  primarySoft: "#FFE4D4",
  secondary: "#3CB89A",
  secondaryDark: "#2A8F78",
  secondarySoft: "#D8F3EC",
  sky: "#6EB6E8",
  skySoft: "#DCEFFA",
  lavender: "#A78BDA",
  lavenderSoft: "#EDE4FA",
  warning: "#E0A84A",
  warningDark: "#8A5A14",
  danger: "#E15A4A",
  dangerDark: "#B03A2E",
  ink: "#2B211C",
  muted: "#8A817C",
  nav: "#1C1C1E",
  white: "#FFFFFF",
} as const;

export type VillaStatus = "available" | "occupied" | "turnover" | "maintenance";
export type CleaningStatus = "not_needed" | "in_progress" | "done";
export type TaskPriority = "normal" | "urgent";
export type TaskStatus = "open" | "done";
export type BillStatus = "pending" | "paid";
export type Messenger = "whatsapp" | "line" | "none";
export type UserRole = "owner" | "manager" | "cleaner" | "staff";
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
    bg: colors.warning,
    fg: "#8A5A14",
    soft: "#FFF0D6",
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
  name: "Pulse Flow Ops",
  tagline: "The pulse of your rental operations",
  description:
    "The pulse of your rental operations. Villa status, tasks, contacts, and bills for owners and on-site managers, in one place.",
} as const;
