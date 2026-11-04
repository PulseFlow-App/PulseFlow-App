import { getDemoProfile, updateDemoStore } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/env";
import { makeNotification } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";
import { PRODUCT_NAME } from "@/lib/pros/i18n";
import type { ProRequest } from "@/lib/pros/types";

const START = `— ${PRODUCT_NAME} —`;
const END = `— End ${PRODUCT_NAME} —`;

export function prosNote(request: ProRequest, professionalName: string) {
  return [START, `Request: ${request.id}`, `Professional: ${professionalName}`, END].join("\n");
}

function upsertNotes(existing: string | null | undefined, block: string) {
  const source = existing ?? "";
  const pattern = /— (?:Pulseflow Services|Pulse Pros) —[\s\S]*?— End (?:Pulseflow Services|Pros) —/;
  if (pattern.test(source)) return source.replace(pattern, block);
  return source.trim() ? `${source.trim()}\n\n${block}` : block;
}

export async function assignRequestToTask(input: {
  request: ProRequest;
  professionalName: string;
  assigneeProfileId: string | null;
}) {
  const { request } = input;
  if (!request.taskId) return { ok: false as const, error: "No task on this request." };
  const block = prosNote(request, input.professionalName);

  if (isDemoMode()) {
    const actor = getDemoProfile();
    if (!actor) return { ok: false as const, error: "Sign in first." };
    updateDemoStore((store) => ({
      ...store,
      tasks: store.tasks.map((task) =>
        task.id === request.taskId
          ? {
              ...task,
              notes: upsertNotes(task.notes, block),
              assigned_to: input.assigneeProfileId ?? task.assigned_to,
            }
          : task,
      ),
      notifications: input.assigneeProfileId
        ? [
            makeNotification({
              org_id: request.orgId || actor.org_id,
              kind: "appointment",
              title: "Quote chosen",
              body: input.professionalName,
              href: `/pros/requests/${request.id}`,
              entity_id: request.id,
              audience_profile_ids: [input.assigneeProfileId],
              dedupe_key: `pros-assign:${request.id}`,
            }),
            ...store.notifications,
          ]
        : store.notifications,
    }));
    return { ok: true as const };
  }

  const supabase = createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("notes, assigned_to, org_id")
    .eq("id", request.taskId)
    .maybeSingle();
  if (!task) return { ok: false as const, error: "Task not found." };
  const { error } = await supabase
    .from("tasks")
    .update({
      notes: upsertNotes(task.notes, block),
      ...(input.assigneeProfileId ? { assigned_to: input.assigneeProfileId } : {}),
    })
    .eq("id", request.taskId);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
