import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  isAppearance,
  type Appearance,
} from "@/lib/appearance/types";

/** Theme-color / PWA chrome per appearance (keeps status bar in sync). */
export const APPEARANCE_THEME_COLOR: Record<Appearance, string> = {
  horizon: "#f5fafc",
  frost: "#eef6fa",
  dark: "#15202a",
};

export function readStoredAppearance(): Appearance {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return isAppearance(raw) ? raw : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function applyAppearance(appearance: Appearance) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (appearance === DEFAULT_APPEARANCE) {
    root.removeAttribute("data-appearance");
  } else {
    root.setAttribute("data-appearance", appearance);
  }
  root.style.colorScheme = appearance === "dark" ? "dark" : "light";

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", APPEARANCE_THEME_COLOR[appearance]);
  }
}

export function persistAppearance(appearance: Appearance) {
  try {
    if (appearance === DEFAULT_APPEARANCE) {
      window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
    }
  } catch {
    /* private mode / blocked storage */
  }
  applyAppearance(appearance);
}

/** Inline boot script — run before paint to avoid flash. */
export const APPEARANCE_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(APPEARANCE_STORAGE_KEY)};var a=localStorage.getItem(k);if(a==="frost"||a==="dark"){document.documentElement.setAttribute("data-appearance",a);document.documentElement.style.colorScheme=a==="dark"?"dark":"light";}}catch(e){}})();`;
