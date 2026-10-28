export const APPEARANCES = ["horizon", "frost", "dark"] as const;

export type Appearance = (typeof APPEARANCES)[number];

export const APPEARANCE_STORAGE_KEY = "pulse-appearance";

export const DEFAULT_APPEARANCE: Appearance = "horizon";

export function isAppearance(value: string | null | undefined): value is Appearance {
  return !!value && (APPEARANCES as readonly string[]).includes(value);
}
