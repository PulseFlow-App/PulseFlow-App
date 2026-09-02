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

/** Support chat for live stays, or cancelled stays (refund follow-up). */
export function canUseSupportStay(
  stay: GuestStay | null | undefined,
  role?: string,
) {
  if (!stay) return false;
  if (isConfirmedStayStatus(stay.status)) return true;
  if (stay.status === "cancelled") {
    return (
      role === "guest" || role === "owner" || role === "manager"
    );
  }
  return false;
}

/** Prefer active, then upcoming. Ignores completed stays. */
export function pickConfirmedStay(stays: GuestStay[]): GuestStay | null {
  return (
    stays.find((s) => s.status === "active") ??
    stays.find((s) => s.status === "upcoming") ??
    null
  );
}

/** Prefer active/upcoming stay; fall back to latest stay for support thread access. */
export function pickGuestSupportStay(stays: GuestStay[]): GuestStay | null {
  const confirmed = pickConfirmedStay(stays);
  if (confirmed) return confirmed;
  if (!stays.length) return null;
  return [...stays].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
  )[0] ?? null;
}
