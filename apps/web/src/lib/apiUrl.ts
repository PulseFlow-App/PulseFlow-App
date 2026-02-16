/**
 * Base URL for the Pulse API (from VITE_API_URL). Used for insights, photos, points.
 */
export function getApiUrl(): string | undefined {
  const url = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL;
  if (typeof url !== 'string' || !url.trim()) return undefined;
  return url.trim().replace(/\/$/, '');
}
