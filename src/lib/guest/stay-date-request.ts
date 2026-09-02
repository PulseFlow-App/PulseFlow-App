import type { GuestStay, StayDateRequest } from "@/lib/types";
import { isConfirmedStayStatus } from "@/lib/guest/confirmed-stay";

/** Accepted quote that still has a live booking (not cancelled/completed). */
export function activeAcceptedRequestForVilla(
  requests: StayDateRequest[],
  stays: GuestStay[],
  villaId: string,
  guestProfileId: string | undefined,
): StayDateRequest | undefined {
  if (!guestProfileId) return undefined;

  const activeStay = stays.find(
    (s) =>
      s.villa_id === villaId &&
      s.guest_profile_id === guestProfileId &&
      isConfirmedStayStatus(s.status),
  );
  if (!activeStay) return undefined;

  return requests.find(
    (r) =>
      r.villa_id === villaId &&
      r.guest_profile_id === guestProfileId &&
      r.status === "accepted" &&
      r.quoted_price_amount != null &&
      r.check_in === activeStay.check_in &&
      r.check_out === activeStay.check_out,
  );
}

export function matchingAcceptedStayDateRequest(
  requests: StayDateRequest[],
  stay: Pick<GuestStay, "villa_id" | "guest_profile_id" | "check_in" | "check_out">,
): StayDateRequest | undefined {
  return requests.find(
    (r) =>
      r.villa_id === stay.villa_id &&
      r.guest_profile_id === stay.guest_profile_id &&
      r.check_in === stay.check_in &&
      r.check_out === stay.check_out &&
      r.status === "accepted",
  );
}

export function closeAcceptedStayDateRequests(
  requests: StayDateRequest[],
  stay: Pick<GuestStay, "villa_id" | "guest_profile_id" | "check_in" | "check_out">,
): StayDateRequest[] {
  return requests.map((r) =>
    r.villa_id === stay.villa_id &&
    r.guest_profile_id === stay.guest_profile_id &&
    r.check_in === stay.check_in &&
    r.check_out === stay.check_out &&
    r.status === "accepted"
      ? { ...r, status: "declined" as const }
      : r,
  );
}
