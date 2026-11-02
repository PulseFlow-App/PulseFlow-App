/** Light tap for selection and submit. No-ops where the platform has no vibration API. */
export function selectionTick() {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(12);
}
