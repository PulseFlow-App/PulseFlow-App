/**
 * Shared limits for photo uploads (screenshots, fridge/workspace photos).
 * Used by Work Routine, Nutrition, and API so client and server stay in sync.
 */

/** Max decoded image size: 10 MB. Fits typical iPhone photos. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** Approx base64 length for 10 MB raw (4/3 * size). Client checks decoded size. */
export const MAX_PHOTO_BASE64_BYTES = Math.ceil((MAX_PHOTO_BYTES * 4) / 3);

/** Human-readable limit for UI messages. */
export const MAX_PHOTO_LABEL = '10 MB';

/**
 * Get decoded byte size from a data URL (base64).
 */
export function getDataUrlDecodedBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return 0;
  const base64Length = dataUrl.length - (comma + 1);
  return Math.ceil((base64Length * 3) / 4);
}

export function isPhotoWithinLimit(dataUrl: string): boolean {
  return getDataUrlDecodedBytes(dataUrl) <= MAX_PHOTO_BYTES;
}
