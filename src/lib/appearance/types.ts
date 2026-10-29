/** Stored values; `horizon` is legacy and normalizes to frost. */
export const APPEARANCES = ["horizon", "frost", "dark"] as const;

export type Appearance = (typeof APPEARANCES)[number];

/** Options shown in Settings (Horizon removed — same look as Frost). */
export const APPEARANCE_OPTIONS = ["frost", "dark"] as const;

export type AppearanceOption = (typeof APPEARANCE_OPTIONS)[number];

export const APPEARANCE_STORAGE_KEY = "pulse-appearance";

export const DEFAULT_APPEARANCE: AppearanceOption = "frost";

export function isAppearance(value: string | null | undefined): value is Appearance {
  return !!value && (APPEARANCES as readonly string[]).includes(value);
}

/** Map legacy `horizon` (and unknown) onto Frost / Dark. */
export function normalizeAppearance(
  value: string | null | undefined,
): AppearanceOption {
  if (value === "dark") return "dark";
  if (value === "frost" || value === "horizon") return "frost";
  return DEFAULT_APPEARANCE;
}
