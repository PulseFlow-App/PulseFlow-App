import type { GuestStay } from "@/lib/types";

/** Minimum full days before check-in when a guest may cancel without host help. */
export const GUEST_SELF_CANCEL_MIN_DAYS = 3;

export function daysUntilCheckIn(
  checkIn: string,
  now: Date = new Date(),
): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const arrival = new Date(`${checkIn}T00:00:00`);
  arrival.setHours(0, 0, 0, 0);
  return Math.round((arrival.getTime() - today.getTime()) / 86_400_000);
}

/** Guest may cancel when check-in is at least 3 calendar days away. */
export function canGuestSelfCancelStay(
  stay: GuestStay,
  now: Date = new Date(),
): boolean {
  if (stay.status !== "upcoming") return false;
  return daysUntilCheckIn(stay.check_in, now) >= GUEST_SELF_CANCEL_MIN_DAYS;
}

export function guestCancelBlockedReason(
  stay: GuestStay,
  now: Date = new Date(),
): "not_upcoming" | "too_late" | null {
  if (stay.status !== "upcoming") return "not_upcoming";
  if (daysUntilCheckIn(stay.check_in, now) < GUEST_SELF_CANCEL_MIN_DAYS) {
    return "too_late";
  }
  return null;
}
