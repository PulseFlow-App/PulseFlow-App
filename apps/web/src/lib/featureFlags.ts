/**
 * Feature flags for gating. Set via env so we can re-enable gates later.
 * When VITE_FULL_ACCESS_FOR_TESTING=true, subscription and wallet gates are
 * bypassed so everyone can test the full experience (e.g. invite testers).
 */

export function getFullAccessForTesting(): boolean {
  const v = typeof import.meta !== 'undefined' && import.meta.env?.VITE_FULL_ACCESS_FOR_TESTING;
  return v === true || v === 'true' || v === '1';
}
