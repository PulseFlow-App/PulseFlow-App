export const TRANSLATE_CONTENT_STORAGE_KEY = "pulseflow_translate_content";

export function readTranslateContentEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(TRANSLATE_CONTENT_STORAGE_KEY);
  if (stored === "0") return false;
  if (stored === "1") return true;
  return true;
}

export function writeTranslateContentEnabled(enabled: boolean): void {
  localStorage.setItem(TRANSLATE_CONTENT_STORAGE_KEY, enabled ? "1" : "0");
}
