/** Light tap for selection and submit. No-ops where the platform has no vibration API. */
export function selectionTick() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(12);
}

/** A slightly stronger tap after a price is accepted. */
export function successTick() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate([10, 30, 16]);
}
