import type { OrgKind, UserRole } from "@/lib/design-tokens";

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  manager: "Management",
  cleaner: "Cleaning team",
  staff: "Staff",
};

export function isCompanyWorkspace(kind: OrgKind | null | undefined) {
  return kind === "company";
}

export function isPersonalWorkspace(kind: OrgKind | null | undefined) {
  return kind === "personal";
}

/** Roles an actor may assign when creating an invite (company only). */
export function invitableRoles(
  actorRole: UserRole,
  orgKind?: OrgKind | null,
): UserRole[] {
  if (!isCompanyWorkspace(orgKind)) return [];
  if (actorRole === "owner") return ["manager", "cleaner", "staff"];
  if (actorRole === "manager") return ["cleaner", "staff"];
  return [];
}

export function canInvite(actorRole: UserRole, orgKind?: OrgKind | null) {
  return invitableRoles(actorRole, orgKind).length > 0;
}

export function canManageVillaAssignments(
  role: UserRole,
  orgKind?: OrgKind | null,
) {
  return isCompanyWorkspace(orgKind) && role === "owner";
}

/** Endorsements / leaderboard / public reputation - company teams only. */
export function canUseTeamReputation(orgKind?: OrgKind | null) {
  return isCompanyWorkspace(orgKind);
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

/** Owners and company managers can browse the talent directory. */
export function canBrowseTalent(role: UserRole, orgKind?: OrgKind | null) {
  if (role === "owner") return true;
  return role === "manager" && isCompanyWorkspace(orgKind);
}

export function canBookServices(
  role: UserRole,
  orgKind?: OrgKind | null,
) {
  if (!isCompanyWorkspace(orgKind)) return false;
  return role === "owner" || role === "manager";
}

/** In-app team chat - company workspaces only. */
export function canUseTeamChat(orgKind?: OrgKind | null) {
  return isCompanyWorkspace(orgKind);
}

/** Personal-only villa creates (no company inventory) - for company staff side work. */
export function personalVillasOnly(role: UserRole, orgKind?: OrgKind | null) {
  if (isPersonalWorkspace(orgKind)) return true;
  return role === "manager" || role === "cleaner" || role === "staff";
}

export function canEditContacts(role: UserRole) {
  return role === "owner" || role === "manager";
}

export function canMarkBillsPaid(role: UserRole) {
  return role === "owner" || role === "manager";
}

/** Owners and managers see every org bill; staff only see their own submissions. */
export function canViewAllBills(role: UserRole) {
  return role === "owner" || role === "manager";
}

/** Spend analytics / budget totals - owners and managers only. */
export function canViewBillFinance(
  role: UserRole,
  _orgKind?: OrgKind | null,
) {
  return canViewAllBills(role);
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
