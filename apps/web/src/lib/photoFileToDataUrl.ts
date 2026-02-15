/**
 * Read a photo file as a data URL. Converts HEIC/HEIF (iPhone) to JPEG in the browser so it can be displayed and uploaded.
 */
import heic2any from 'heic2any';

const HEIC_TYPES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];

export function isHeicFile(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  return HEIC_TYPES.includes(type) || file.name?.toLowerCase().endsWith('.heic') || file.name?.toLowerCase().endsWith('.heif');
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** User-facing message when HEIC conversion fails (e.g. unsupported on this browser/device). */
export const HEIC_CONVERSION_ERROR_MESSAGE =
  'HEIC conversion failed. Convert to JPEG on your device or use a JPEG/PNG image.';

/**
 * Returns a data URL (JPEG for HEIC, or original for JPEG/PNG/WebP). Rejects on error.
 * On desktop, file.type for .heic is often empty; we pass a typed Blob so heic2any gets a proper input.
 */
export async function photoFileToDataUrl(file: File): Promise<string> {
  if (isHeicFile(file)) {
    try {
      const blob =
        file.type && HEIC_TYPES.includes(file.type.toLowerCase())
          ? file
          : new Blob([await file.arrayBuffer()], { type: 'image/heic' });
      const result = await heic2any({ blob, toType: 'image/jpeg', quality: 1 });
      const out = Array.isArray(result) ? result[0] : result;
      if (!out) throw new Error(HEIC_CONVERSION_ERROR_MESSAGE);
      return await blobToDataUrl(out);
    } catch {
      throw new Error(HEIC_CONVERSION_ERROR_MESSAGE);
    }
  }
  try {
    return await blobToDataUrl(file);
  } catch {
    throw new Error('Could not load image. Try JPEG or PNG.');
  }
}
