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

/**
 * Returns a data URL (JPEG for HEIC, or original for JPEG/PNG/WebP). Rejects on error.
 */
export async function photoFileToDataUrl(file: File): Promise<string> {
  if (isHeicFile(file)) {
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 1 });
    const blob = Array.isArray(result) ? result[0] : result;
    if (!blob) throw new Error('HEIC conversion failed');
    return blobToDataUrl(blob);
  }
  return blobToDataUrl(file);
}
