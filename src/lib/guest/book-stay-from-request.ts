import type { GuestStay, GuestStayStatus, StayDateRequest, Villa } from "@/lib/types";
import {
  guestStayStatusFromDates,
  statusFromStayDates,
  todayIsoDate,
} from "@/lib/villas/status-from-dates";

export function buildStayBookingFromRequest(
  request: Pick<
    StayDateRequest,
    "check_in" | "check_out" | "villa_id" | "org_id" | "guest_profile_id"
  >,
  today = todayIsoDate(),
): {
  villaStatus: Villa["status"];
  stayStatus: GuestStayStatus;
  villaDates: { check_in: string; check_out: string };
} {
  const villaStatus =
    statusFromStayDates(request.check_in, request.check_out, today) ??
    "available";
  const stayStatus = guestStayStatusFromDates(
    request.check_in,
    request.check_out,
    today,
  );
  return {
    villaStatus,
    stayStatus,
    villaDates: {
      check_in: request.check_in,
      check_out: request.check_out,
    },
  };
}

export function mergeGuestStayFromRequest(
  existing: GuestStay | undefined,
  request: StayDateRequest,
  stayStatus: GuestStayStatus,
  createId: () => string,
): GuestStay {
  if (existing) {
    return {
      ...existing,
      check_in: request.check_in,
      check_out: request.check_out,
      status: stayStatus,
    };
  }
  return {
    id: createId(),
    org_id: request.org_id,
    villa_id: request.villa_id,
    guest_profile_id: request.guest_profile_id,
    check_in: request.check_in,
    check_out: request.check_out,
    status: stayStatus,
    owner_notices: null,
    created_at: new Date().toISOString(),
  };
}
