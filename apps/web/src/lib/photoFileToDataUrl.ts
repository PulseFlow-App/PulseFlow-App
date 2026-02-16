/**
 * Read a photo file as a data URL. Converts HEIC/HEIF (iPhone) to JPEG in the browser so it can be displayed and uploaded.
 * Uses heic2any first (native support where available), then heic-decode (WASM) fallback for desktop browsers.
 */
import heic2any from 'heic2any';
import decode from 'heic-decode';

const HEIC_TYPES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];

/** HEIF/HEIC brands at offset 8 in ftyp box (ISO Base Media). */
const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'mif1', 'msf1']);

export function isHeicFile(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  return HEIC_TYPES.includes(type) || file.name?.toLowerCase().endsWith('.heic') || file.name?.toLowerCase().endsWith('.heif');
}

/** Detect HEIC/HEIF by file signature (ftyp at 4, brand at 8). Safari sometimes sends HEIC with wrong type/name. */
export async function isHeicByMagicBytes(file: File): Promise<boolean> {
  const buf = await file.slice(0, 12).arrayBuffer();
  if (buf.byteLength < 12) return false;
  const u8 = new Uint8Array(buf);
  const ftyp =
    u8[4] === 0x66 && u8[5] === 0x74 && u8[6] === 0x79 && u8[7] === 0x70; // "ftyp"
  if (!ftyp) return false;
  const brand = String.fromCharCode(u8[8] ?? 0, u8[9] ?? 0, u8[10] ?? 0, u8[11] ?? 0);
  return HEIC_BRANDS.has(brand);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** User-facing message when HEIC conversion fails after trying both methods. */
export const HEIC_CONVERSION_ERROR_MESSAGE =
  'HEIC conversion failed. Convert to JPEG on your device or use a JPEG/PNG image.';

/** Convert HEIC using heic2any (uses native browser support; works in Safari, some Chrome). */
async function tryHeic2Any(blob: Blob): Promise<string> {
  const result = await heic2any({ blob, toType: 'image/jpeg', quality: 1 });
  const out = Array.isArray(result) ? result[0] : result;
  if (!out) throw new Error(HEIC_CONVERSION_ERROR_MESSAGE);
  return blobToDataUrl(out);
}

/** Convert HEIC using heic-decode (WASM) + canvas. Works in desktop Chrome/Firefox/Edge where native HEIC isn't available. */
async function tryHeicDecodeWasm(buffer: ArrayBuffer): Promise<string> {
  const { width, height, data } = await decode({ buffer });
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), { width, height });
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(HEIC_CONVERSION_ERROR_MESSAGE);
  const imageData = new ImageData(data, width, height);
  ctx.putImageData(imageData, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => {
    if (canvas instanceof OffscreenCanvas) {
      canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 }).then(resolve);
    } else {
      (canvas as HTMLCanvasElement).toBlob((b) => resolve(b), 'image/jpeg', 0.92);
    }
  });
  if (!blob) throw new Error(HEIC_CONVERSION_ERROR_MESSAGE);
  return blobToDataUrl(blob);
}

async function tryHeicConversion(blob: Blob): Promise<string> {
  try {
    return await tryHeic2Any(blob);
  } catch {
    // Fallback: WASM decoder (works on desktop without native HEIC support)
    const buffer = await blob.arrayBuffer();
    return tryHeicDecodeWasm(buffer);
  }
}

/**
 * Returns a data URL (JPEG for HEIC, or original for JPEG/PNG/WebP). Rejects on error.
 * Detects HEIC by type/name or by file magic bytes (Safari sometimes sends HEIC with wrong type).
 */
export async function photoFileToDataUrl(file: File): Promise<string> {
  const knownHeic = isHeicFile(file);
  if (knownHeic) {
    try {
      const blob =
        file.type && HEIC_TYPES.includes(file.type.toLowerCase())
          ? file
          : new Blob([await file.arrayBuffer()], { type: 'image/heic' });
      return await tryHeicConversion(blob);
    } catch {
      throw new Error(HEIC_CONVERSION_ERROR_MESSAGE);
    }
  }
  // Safari/iOS can send HEIC with wrong type/name; detect by magic bytes and try conversion
  if (await isHeicByMagicBytes(file)) {
    try {
      const blob = new Blob([await file.arrayBuffer()], { type: 'image/heic' });
      return await tryHeicConversion(blob);
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
