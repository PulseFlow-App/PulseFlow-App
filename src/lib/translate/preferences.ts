export const TRANSLATE_CONTENT_STORAGE_KEY = "pulseflow_translate_content";

/** Always on - team content translation is not optional. */
export function readTranslateContentEnabled(): boolean {
  return true;
}

export function writeTranslateContentEnabled(_enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRANSLATE_CONTENT_STORAGE_KEY, "1");
}
