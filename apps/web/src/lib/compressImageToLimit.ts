/**
 * Compress a data URL image so its decoded size is at or under maxBytes.
 * Uses canvas resize + JPEG quality so large photos (e.g. from iPhone) fit the upload limit.
 */
import { getDataUrlDecodedBytes } from './photoLimit';

const MAX_DIMENSION = 2048;
const INITIAL_QUALITY = 0.88;
const MIN_QUALITY = 0.5;

function dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = dataUrl;
  });
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const cb = (blob: Blob | null) => {
      if (!blob) {
        reject(new Error('Could not compress image'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    };
    if (canvas instanceof OffscreenCanvas) {
      canvas.convertToBlob({ type: 'image/jpeg', quality }).then(cb);
    } else {
      (canvas as HTMLCanvasElement).toBlob((b) => cb(b), 'image/jpeg', quality);
    }
  });
}

/**
 * Returns a JPEG data URL with decoded size <= maxBytes.
 * If the image is already under the limit, returns it as-is (or re-encoded as JPEG for consistency).
 * Otherwise scales and/or reduces quality until under the limit.
 */
export async function compressDataUrlToMaxBytes(
  dataUrl: string,
  maxBytes: number
): Promise<string> {
  const bytes = getDataUrlDecodedBytes(dataUrl);
  if (bytes <= maxBytes) return dataUrl;

  const img = await dataUrlToImage(dataUrl);
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width >= height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(img, 0, 0, width, height);

  let quality = INITIAL_QUALITY;
  let result = await canvasToDataUrl(canvas, quality);
  while (getDataUrlDecodedBytes(result) > maxBytes && quality > MIN_QUALITY) {
    quality -= 0.1;
    result = await canvasToDataUrl(canvas, Math.max(quality, MIN_QUALITY));
  }
  return result;
}
