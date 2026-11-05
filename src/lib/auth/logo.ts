import type { SupabaseClient } from "@supabase/supabase-js";

const DATA_URL = /^data:image\/(jpeg|jpg|png|webp);base64,([a-z0-9+/=\s]+)$/i;

function looksLikeImage(buf: Buffer, type: string) {
  if (type === "image/png") return buf[0] === 0x89 && buf[1] === 0x50;
  if (type === "image/webp") return buf.toString("ascii", 0, 4) === "RIFF";
  return buf[0] === 0xff && buf[1] === 0xd8;
}

/** Accept a small JPEG, PNG, or WebP data URL from the registration form. */
export function decodeAccountLogo(value: string) {
  if (value.length > 2_000_000) return null;
  const match = DATA_URL.exec(value.trim());
  if (!match) return null;
  const buf = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (buf.length < 32 || buf.length > 1_800_000) return null;
  const kind = match[1].toLowerCase();
  const type = kind === "png" ? "image/png" : kind === "webp" ? "image/webp" : "image/jpeg";
  const ext = kind === "png" ? "png" : kind === "webp" ? "webp" : "jpg";
  if (!looksLikeImage(buf, type)) return null;
  return { buf, type, ext };
}

/** Store the logo in the public logos bucket. A short data URL is kept if storage is unavailable. */
export async function storeAccountLogo(
  admin: SupabaseClient,
  userId: string,
  dataUrl: string,
): Promise<string | null> {
  const parsed = decodeAccountLogo(dataUrl);
  if (!parsed) return null;
  const path = `${userId}.${parsed.ext}`;
  const { error } = await admin.storage.from("logos").upload(path, parsed.buf, {
    contentType: parsed.type,
    upsert: true,
  });
  if (!error) {
    return admin.storage.from("logos").getPublicUrl(path).data.publicUrl || null;
  }
  if (dataUrl.length <= 200_000) return dataUrl;
  return null;
}
