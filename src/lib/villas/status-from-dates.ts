import type { Villa } from "@/lib/types";
import type { VillaStatus } from "@/lib/design-tokens";

export function todayIsoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Derive occupancy from stay dates.
 * - After check-out → available
 * - Check-out day → turnover
 * - During stay → occupied
 * - Before check-in (dates set) → available
 * Maintenance is never derived here.
 */
export function statusFromStayDates(
  check_in: string | null | undefined,
  check_out: string | null | undefined,
  today = todayIsoDate(),
): VillaStatus | null {
  if (!check_in && !check_out) return null;
  if (check_out && today > check_out) return "available";
  if (check_out && today === check_out) return "turnover";
  if (check_in && today >= check_in && (!check_out || today < check_out)) {
    return "occupied";
  }
  if (check_in && today < check_in) return "available";
  return null;
}

export function guestStayStatusFromDates(
  check_in: string,
  check_out: string,
  today = todayIsoDate(),
): "upcoming" | "active" | "completed" {
  if (today > check_out) return "completed";
  if (today >= check_in) return "active";
  return "upcoming";
}

/** Patch when stored status/dates disagree with the calendar. Skips maintenance. */
export function dateDrivenVillaPatch(
  villa: Pick<Villa, "status" | "check_in" | "check_out">,
  today = todayIsoDate(),
): Partial<Pick<Villa, "status" | "check_in" | "check_out">> | null {
  if (villa.status === "maintenance") return null;

  const derived = statusFromStayDates(villa.check_in, villa.check_out, today);
  if (!derived) return null;

  const pastCheckout = Boolean(villa.check_out && today > villa.check_out);
  const patch: Partial<Pick<Villa, "status" | "check_in" | "check_out">> = {};
  let changed = false;

  if (villa.status !== derived) {
    patch.status = derived;
    changed = true;
  }
  if (pastCheckout && (villa.check_in || villa.check_out)) {
    patch.check_in = null;
    patch.check_out = null;
    changed = true;
  }

  return changed ? patch : null;
}
