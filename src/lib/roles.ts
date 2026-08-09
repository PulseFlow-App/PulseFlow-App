import type { UserRole } from "@/lib/design-tokens";

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  manager: "Management",
  cleaner: "Cleaning team",
  staff: "Staff",
};

/** Roles an actor may assign when creating an invite. */
export function invitableRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === "owner") return ["manager", "cleaner", "staff"];
  if (actorRole === "manager") return ["cleaner", "staff"];
  return [];
}

export function canInvite(actorRole: UserRole) {
  return invitableRoles(actorRole).length > 0;
}

export function canManageVillaAssignments(role: UserRole) {
  return role === "owner";
}

export function canCreateVillas(role: UserRole) {
  return (
    role === "owner" ||
    role === "manager" ||
    role === "cleaner" ||
    role === "staff"
  );
}

/** Cleaner / field staff get the simplified field app. */
export function isStaffApp(role: UserRole) {
  return role === "cleaner" || role === "staff";
}

export function canBookServices(role: UserRole) {
  return role === "owner" || role === "manager";
}

/** Personal-only villa creates (no company inventory). */
export function personalVillasOnly(role: UserRole) {
  return role === "manager" || role === "cleaner" || role === "staff";
}

export function canEditContacts(role: UserRole) {
  return role === "owner" || role === "manager";
}

export function canMarkBillsPaid(role: UserRole) {
  return role === "owner" || role === "manager";
}

export function canEditVillaCore(role: UserRole) {
  return role === "owner" || role === "manager";
}

export function isOwnerApp(role: UserRole) {
  return role === "owner";
}

export function isOpsApp(role: UserRole) {
  return role !== "owner";
}
