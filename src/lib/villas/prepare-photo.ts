const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

/** Decode + resize to a JPEG the browser can display (fixes iPhone HEIC / huge camera files). */
export async function prepareVillaPhotoFile(file: File): Promise<File> {
  const source = await decodeImage(file);
  const width = "width" in source ? source.width : 0;
  const height = "height" in source ? source.height : 0;
  if (!width || !height) return file;

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });
  if (!blob) return file;
  const base = file.name.replace(/\.[^.]+$/, "") || "property";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

export function isTransientPhotoUrl(url: string | null | undefined) {
  return Boolean(url?.startsWith("data:") || url?.startsWith("blob:"));
}

export async function uploadPreparedVillaPhoto(
  file: File,
  upload: (file: File) => Promise<string | null>,
) {
  const prepared = await prepareVillaPhotoFile(file);
  const url = await upload(prepared);
  if (!url) throw new Error("Could not upload photo.");
  return url;
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    return loadHtmlImage(file);
  }
}

function loadHtmlImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that photo. Try a JPEG or PNG."));
    };
    img.src = url;
  });
}
