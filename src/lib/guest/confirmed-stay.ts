import type { GuestStay, GuestStayStatus } from "@/lib/types";

/** Confirmed stay = host accepted dates (upcoming or currently active). */
export function isConfirmedStayStatus(status: GuestStayStatus) {
  return (
    status === "active" ||
    status === "upcoming"
  );
}

export function isConfirmedStay(stay: GuestStay | null | undefined) {
  return Boolean(stay && isConfirmedStayStatus(stay.status));
}

/** Prefer active, then upcoming. Ignores completed stays. */
export function pickConfirmedStay(stays: GuestStay[]): GuestStay | null {
  return (
    stays.find((s) => s.status === "active") ??
    stays.find((s) => s.status === "upcoming") ??
    null
  );
}
