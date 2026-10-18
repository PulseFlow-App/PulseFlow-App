/**
 * Release stamp shown in footers / update checks.
 * Bump only when asked — not on every push or deploy.
 */
export const APP_VERSION = "1.0.0";

/** Human-readable release date (manual). */
export const APP_UPDATED_AT = "18 Oct 2026";

export function formatAppVersion(version = APP_VERSION, updatedAt = APP_UPDATED_AT) {
  return `v${version} · ${updatedAt}`;
}

/** Semver-ish compare: 1 if a>b, -1 if a<b, 0 if equal / unparsable. */
export function compareAppVersions(a: string, b: string): number {
  const parse = (v: string) =>
    v
      .replace(/^v/i, "")
      .split(/[.+-]/)
      .map((part) => {
        const n = Number.parseInt(part, 10);
        return Number.isFinite(n) ? n : 0;
      });
  const left = parse(a);
  const right = parse(b);
  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    const lv = left[i] ?? 0;
    const rv = right[i] ?? 0;
    if (lv > rv) return 1;
    if (lv < rv) return -1;
  }
  return 0;
}
