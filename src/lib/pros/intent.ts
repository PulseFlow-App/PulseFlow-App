import type { ProsActor } from "@/lib/pros/types";

/** Maintenance accounts. Their home is a work panel, not a search. */
export function isWorkAccount(actor: ProsActor | null) {
  if (!actor) return false;
  if (actor.role === "staff" || actor.role === "cleaner") return true;
  return actor.intent === "work";
}

/** Marketplace home. Only a signed-in account that came to look for staff. */
export function isHireAccount(actor: ProsActor | null) {
  if (!actor || isWorkAccount(actor)) return false;
  return actor.intent === "hire";
}
