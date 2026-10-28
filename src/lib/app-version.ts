/**
 * Marketing / footer release stamp.
 * Bump APP_VERSION + APP_UPDATED_AT only when you intentionally ship a named
 * release — not on every Vercel deploy. Deploy detection for the refresh modal
 * uses BUILD_ID (git SHA), not these values.
 */
export const APP_VERSION = "1.0.0";

/** Human-readable release date (manual). */
export const APP_UPDATED_AT = "18 Oct 2026";

/**
 * Per-deploy id baked into the client at build time (see next.config.ts).
 * Changes on every Vercel deploy so /api/version can detect a stale tab.
 */
export const CLIENT_BUILD_ID =
  process.env.NEXT_PUBLIC_BUILD_ID?.trim() || "dev";

/** Server-side deploy id for /api/version (same source as CLIENT_BUILD_ID on Vercel). */
export function resolveServerBuildId(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.VERCEL_DEPLOYMENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_BUILD_ID?.trim() ||
    "dev"
  );
}

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
