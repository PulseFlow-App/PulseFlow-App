import type { Task } from "@/lib/types";
import type { UserRole } from "@/lib/design-tokens";
import { canBookServices } from "@/lib/roles";

/** Owners mark tasks done immediately. */
export function canCompleteTaskDirectly(role: UserRole) {
  return role === "owner";
}

/** Managers and field staff submit work for verification. */
export function canSubmitTaskVerify(role: UserRole) {
  return role === "manager" || role === "staff" || role === "cleaner";
}

/**
 * Owners and managers can approve/reject a verification —
 * not the person who submitted it.
 */
export function canApproveTaskVerify(
  actor: { id: string; role: UserRole },
  task: Pick<Task, "status" | "verify_submitted_by">,
  orgKind?: "personal" | "company" | null,
) {
  if (task.status !== "pending_verify") return false;
  if (actor.role !== "owner" && actor.role !== "manager") return false;
  if (actor.role === "manager" && !canBookServices(actor.role, orgKind)) {
    return false;
  }
  if (task.verify_submitted_by && task.verify_submitted_by === actor.id) {
    return false;
  }
  return true;
}

export function clearTaskVerifyFields() {
  return {
    verify_notes: null as string | null,
    verify_photo_url: null as string | null,
    verify_submitted_by: null as string | null,
    verify_submitted_at: null as string | null,
  };
}
