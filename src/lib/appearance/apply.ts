import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  normalizeAppearance,
  type Appearance,
  type AppearanceOption,
} from "@/lib/appearance/types";

/** Theme-color / PWA chrome per appearance (keeps status bar in sync). */
export const APPEARANCE_THEME_COLOR: Record<AppearanceOption, string> = {
  frost: "#eef6fa",
  dark: "#15202a",
};

export function readStoredAppearance(): AppearanceOption {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return normalizeAppearance(raw);
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function applyAppearance(appearance: Appearance | AppearanceOption) {
  if (typeof document === "undefined") return;
  const next = normalizeAppearance(appearance);
  const root = document.documentElement;
  root.setAttribute("data-appearance", next);
  root.style.colorScheme = next === "dark" ? "dark" : "light";

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", APPEARANCE_THEME_COLOR[next]);
  }
}

export function persistAppearance(appearance: Appearance | AppearanceOption) {
  const next = normalizeAppearance(appearance);
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, next);
  } catch {
    /* private mode / blocked storage */
  }
  applyAppearance(next);
}

/** Inline boot script — run before paint to avoid flash. */
export const APPEARANCE_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(APPEARANCE_STORAGE_KEY)};var a=localStorage.getItem(k);if(a==="horizon"||!a)a="frost";if(a!=="frost"&&a!=="dark")a="frost";document.documentElement.setAttribute("data-appearance",a);document.documentElement.style.colorScheme=a==="dark"?"dark":"light";}catch(e){}})();`;
