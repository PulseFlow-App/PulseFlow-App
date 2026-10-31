/**
 * Education tour completion bus. Emit from success paths only.
 * No polling. Listeners live in EducationProvider.
 */

export type EducationEventType =
  | "property.created"
  | "calendar.saved"
  | "checkin.created"
  | "contact.created"
  | "job.created"
  | "task.created"
  | "step.acknowledged";

export type EducationLogEvent =
  | "tour_started"
  | "step_viewed"
  | "step_done"
  | "step_skipped"
  | "tour_paused"
  | "tour_completed";

type Listener = (type: EducationEventType, detail?: { stepId?: string }) => void;

const listeners = new Set<Listener>();

export function onEducationEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitEducationEvent(
  type: EducationEventType,
  detail?: { stepId?: string },
): void {
  listeners.forEach((fn) => {
    try {
      fn(type, detail);
    } catch {
      /* ignore listener errors */
    }
  });
}

export function logEducation(event: EducationLogEvent, payload?: Record<string, unknown>) {
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[education]", event, payload ?? {});
  }
}
