import type { ProsActor } from "@/lib/pros/types";

/** Maintenance accounts. Their home is a work panel, not a search. */
export function isWorkAccount(actor: ProsActor | null) {
  if (!actor) return false;
  if (actor.role === "staff" || actor.role === "cleaner") return true;
  return actor.intent === "work";
}

/** Search home. Anyone who is not a maintenance account, including people who have not signed in. */
export function isHireAccount(actor: ProsActor | null) {
  return !isWorkAccount(actor);
}
