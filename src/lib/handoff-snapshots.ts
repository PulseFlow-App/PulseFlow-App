import type { HandoffPayload } from "@/lib/export/ops-export";
import type { HandoffSnapshot } from "@/lib/types";
import { createClient, isDemoMode } from "@/lib/supabase/client";

const demoKey = (orgId: string) => `pf-handoff-${orgId}`;

type DemoStored = Pick<HandoffSnapshot, "id" | "label" | "payload" | "created_at">;

function readDemo(orgId: string): HandoffSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(demoKey(orgId));
    if (!raw) return [];
    const rows = JSON.parse(raw) as DemoStored[];
    return rows.map((row) => ({
      ...row,
      org_id: orgId,
      created_by: "",
    }));
  } catch {
    return [];
  }
}

function writeDemo(orgId: string, rows: DemoStored[]) {
  localStorage.setItem(demoKey(orgId), JSON.stringify(rows));
}

export async function listHandoffSnapshots(orgId: string): Promise<HandoffSnapshot[]> {
  if (isDemoMode()) return readDemo(orgId);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("handoff_snapshots")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as HandoffSnapshot[];
}

export async function saveHandoffSnapshot(input: {
  orgId: string;
  profileId: string;
  label: string;
  payload: HandoffPayload;
}): Promise<HandoffSnapshot> {
  if (isDemoMode()) {
    const row: DemoStored = {
      id: crypto.randomUUID(),
      label: input.label.trim() || "Handoff",
      payload: input.payload,
      created_at: new Date().toISOString(),
    };
    const next = [row, ...readDemo(input.orgId).map(({ id, label, payload, created_at }) => ({
      id,
      label,
      payload: payload as HandoffPayload,
      created_at,
    }))].slice(0, 20);
    writeDemo(input.orgId, next);
    return { ...row, org_id: input.orgId, created_by: input.profileId };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("handoff_snapshots")
    .insert({
      org_id: input.orgId,
      created_by: input.profileId,
      label: input.label.trim() || "Handoff",
      payload: input.payload,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as HandoffSnapshot;
}

export async function deleteHandoffSnapshot(id: string, orgId: string) {
  if (isDemoMode()) {
    const kept = readDemo(orgId)
      .filter((s) => s.id !== id)
      .map(({ id: sid, label, payload, created_at }) => ({
        id: sid,
        label,
        payload: payload as HandoffPayload,
        created_at,
      }));
    writeDemo(orgId, kept);
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from("handoff_snapshots").delete().eq("id", id);
  if (error) throw error;
}
