/**
 * Move personal villas (and related org-scoped rows) into a company org.
 */

type AdminLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

/** Tables that scope rows by both org_id and villa_id. */
const RELATED_TABLES = [
  "house_guides",
  "villa_master_info",
  "villa_maintenance_logs",
  "villa_calendar_bookings",
  "villa_assignments",
  "tasks",
  "bills",
  "service_orders",
  "guest_stays",
  "stay_date_requests",
] as const;

export async function moveVillasToOrg(
  admin: AdminLike,
  input: {
    villaIds: string[];
    fromOrgId: string;
    toOrgId: string;
  },
): Promise<{ villasMoved: number }> {
  if (!input.villaIds.length) return { villasMoved: 0 };

  const { data: moved, error: villaErr } = await admin
    .from("villas")
    .update({ org_id: input.toOrgId })
    .eq("org_id", input.fromOrgId)
    .in("id", input.villaIds)
    .select("id");
  if (villaErr) throw new Error(villaErr.message);

  for (const table of RELATED_TABLES) {
    const { error } = await admin
      .from(table)
      .update({ org_id: input.toOrgId })
      .eq("org_id", input.fromOrgId)
      .in("villa_id", input.villaIds);
    // Soft-skip missing tables/columns on older DBs.
    if (error && !/does not exist|PGRST205|42703/i.test(error.message)) {
      throw new Error(`${table}: ${error.message}`);
    }
  }

  // Stay-linked rows (no villa_id) for guest stays that moved.
  const { data: stays } = await admin
    .from("guest_stays")
    .select("id")
    .eq("org_id", input.toOrgId)
    .in("villa_id", input.villaIds);
  const stayIds = ((stays as { id: string }[]) ?? []).map((s) => s.id);
  if (stayIds.length) {
    for (const table of [
      "support_messages",
      "guest_deposits",
      "guest_charges",
      "stay_photos",
      "guest_briefings",
    ] as const) {
      const { error } = await admin
        .from(table)
        .update({ org_id: input.toOrgId })
        .in("stay_id", stayIds);
      if (error && !/does not exist|PGRST205|42703/i.test(error.message)) {
        throw new Error(`${table}: ${error.message}`);
      }
    }
  }

  return { villasMoved: (moved as { id: string }[] | null)?.length ?? 0 };
}
