import type { GuestStay, Profile } from "@/lib/types";
import { canGuestSelfCancelStay } from "@/lib/guest/cancel-booking";
import { parseCancelCommand } from "@/lib/guest/support-cancel-command";
import { makeNotification } from "@/lib/notifications";
import { formatShortDate } from "@/lib/utils";

export type SupportCancelAction = {
  kind: "guest_request";
  displayBody: string;
  notifications: ReturnType<typeof makeNotification>[];
};

export function resolveSupportCancelAction(input: {
  body: string;
  profile: Profile;
  stay: GuestStay;
  villaName: string;
  ownerManagerIds: string[];
}): SupportCancelAction | null {
  if (!parseCancelCommand(input.body, input.profile.role)) return null;

  const dateLine = `${formatShortDate(input.stay.check_in)} → ${formatShortDate(input.stay.check_out)}`;

  if (canGuestSelfCancelStay(input.stay)) {
    throw new Error(
      "You can still cancel from Home until 3 days before check-in — no need to message Support.",
    );
  }
  if (input.stay.status === "completed" || input.stay.status === "cancelled") {
    throw new Error("This stay cannot be cancelled.");
  }

  return {
    kind: "guest_request",
    displayBody: `/cancel — ${input.villaName} · ${dateLine}`,
    notifications: [
      makeNotification({
        org_id: input.stay.org_id,
        kind: "guest_update",
        title: "Guest requested cancellation",
        body: `${input.profile.full_name} · ${input.villaName} · ${dateLine}. Open Guests and cancel the booking there.`,
        href: "/guests",
        entity_id: input.stay.id,
        audience_profile_ids: input.ownerManagerIds,
      }),
    ],
  };
}
