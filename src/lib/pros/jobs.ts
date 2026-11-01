import type { ProsState } from "@/lib/pros/types";

export const PROS_STORAGE_KEY = "pulseflow.pros.v1";
export const PROS_EVENT = "pros-storage";

export function readProsState(): ProsState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProsState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.profiles)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeProsState(state: ProsState, notify = true) {
  localStorage.setItem(PROS_STORAGE_KEY, JSON.stringify(state));
  if (notify) window.dispatchEvent(new Event(PROS_EVENT));
}

/** A completed Pulse Flow task is the source of a verified job. */
export function recordVerifiedJob(taskId: string) {
  const state = readProsState();
  if (!state) return;
  const request = state.requests.find(
    (row) => row.taskId === taskId && row.chosenProfileId && row.status !== "cancelled",
  );
  if (!request?.chosenProfileId) return;
  const exists = state.jobs.some(
    (job) => job.taskId === taskId || job.requestId === request.id,
  );
  if (exists) {
    if (request.status !== "completed") {
      request.status = "completed";
      writeProsState(state);
    }
    return;
  }
  state.jobs.push({
    id: crypto.randomUUID(),
    profileId: request.chosenProfileId,
    requestId: request.id,
    taskId,
    categoryId: request.categoryId,
    completedAt: new Date().toISOString(),
  });
  request.status = "completed";
  state.events.push({
    id: crypto.randomUUID(),
    name: "job_verified",
    actorId: null,
    ref: request.id,
    at: new Date().toISOString(),
  });
  writeProsState(state);
}
