import type { OrgKind, UserRole } from "@/lib/design-tokens";

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  manager: "Management",
  cleaner: "Cleaning team",
  staff: "Staff",
  guest: "Guest",
};

export function isCompanyWorkspace(kind: OrgKind | null | undefined) {
  return kind === "company";
}

export function isPersonalWorkspace(kind: OrgKind | null | undefined) {
  return kind === "personal";
}

/** Staff invite roles (managers + field team) for company owner/manager. */
export function invitableStaffRoles(
  actorRole: UserRole,
  orgKind?: OrgKind | null,
): Array<"manager" | "cleaner" | "staff"> {
  if (!isCompanyWorkspace(orgKind)) return [];
  if (actorRole === "owner" || actorRole === "manager") {
    return ["manager", "cleaner", "staff"];
  }
  return [];
}

/** @deprecated Prefer invitableStaffRoles + guest invites. */
export function invitableRoles(
  actorRole: UserRole,
  orgKind?: OrgKind | null,
): UserRole[] {
  return invitableStaffRoles(actorRole, orgKind);
}

export function canInvite(actorRole: UserRole, orgKind?: OrgKind | null) {
  return invitableStaffRoles(actorRole, orgKind).length > 0;
}

/** Anyone with an account can share a generic register referral link. */
export function canInviteAnyone(_role: UserRole) {
  return true;
}

/** Company owners and managers can invite team (managers + staff). */
export function canInviteStaff(role: UserRole, orgKind?: OrgKind | null) {
  return invitableStaffRoles(role, orgKind).length > 0;
}

/** Company owners and managers can invite stay guests. */
export function canInviteGuest(role: UserRole, orgKind?: OrgKind | null) {
  return isCompanyWorkspace(orgKind) && (role === "owner" || role === "manager");
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

/** Owners and managers can cast weekly stars for teammates. */
export function canCastEndorsement(
  role: UserRole,
  orgKind?: OrgKind | null,
) {
  if (!canUseTeamReputation(orgKind)) return false;
  return role === "owner" || role === "manager";
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

/** Stay guests get the guest stay app. */
export function isGuestApp(role: UserRole) {
  return role === "guest";
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

/** In-app team chat - company workspaces only (not guest stay chat). */
export function canUseTeamChat(orgKind?: OrgKind | null, role?: UserRole) {
  if (!isCompanyWorkspace(orgKind)) return false;
  if (role === "guest") return false;
  return true;
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
  return role !== "owner" && role !== "guest";
}
