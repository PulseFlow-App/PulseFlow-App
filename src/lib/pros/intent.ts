import type { ProsActor } from "@/lib/pros/types";

/** Maintenance accounts. Their home is a work panel, not a search. */
export function isWorkAccount(actor: ProsActor | null) {
  if (!actor) return false;
  return actor.role === "staff" || actor.role === "cleaner";
}

/** People looking for someone to do the work. A property owner or manager is this, even if an older choice said otherwise. */
export function isHireAccount(actor: ProsActor | null) {
  if (!actor || actor.role === "guest" || isWorkAccount(actor)) return false;
  return true;
}
