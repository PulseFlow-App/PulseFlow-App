const STORAGE_KEY = "pulseflow_guest_selected_stay";

export function readSelectedStayId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeSelectedStayId(stayId: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (stayId) sessionStorage.setItem(STORAGE_KEY, stayId);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function guestBookingGuideHref(stayId: string) {
  return `/villas?stay=${encodeURIComponent(stayId)}`;
}
