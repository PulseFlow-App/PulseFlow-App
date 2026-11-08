import type { SupabaseClient } from "@supabase/supabase-js";

const DATA_URL = /^data:image\/(jpeg|jpg|png|webp);base64,([a-z0-9+/=\s]+)$/i;

function decodeServiceImage(value: string) {
  if (value.length > 8_000_000) return null;
  const match = DATA_URL.exec(value.trim());
  if (!match) return null;
  const buf = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  // After client resize, phone photos are usually well under 2 MB.
  if (buf.length < 32 || buf.length > 5_000_000) return null;
  const kind = match[1].toLowerCase();
  const type = kind === "png" ? "image/png" : kind === "webp" ? "image/webp" : "image/jpeg";
  const ext = kind === "png" ? "png" : kind === "webp" ? "webp" : "jpg";
  if (type === "image/png" && !(buf[0] === 0x89 && buf[1] === 0x50)) return null;
  if (type === "image/webp" && buf.toString("ascii", 0, 4) !== "RIFF") return null;
  if (type === "image/jpeg" && !(buf[0] === 0xff && buf[1] === 0xd8)) return null;
  return { buf, type, ext };
}

/** Store a request or chat photo. A short data URL is kept if the bucket is not ready. */
export async function storeChatPhoto(
  admin: SupabaseClient,
  requestId: string,
  dataUrl: string,
): Promise<string | null> {
  const parsed = decodeServiceImage(dataUrl);
  if (!parsed) return null;
  const path = `${requestId}/${crypto.randomUUID()}.${parsed.ext}`;
  const { error } = await admin.storage.from("service-chat").upload(path, parsed.buf, {
    contentType: parsed.type,
    upsert: false,
  });
  if (!error) {
    return admin.storage.from("service-chat").getPublicUrl(path).data.publicUrl || null;
  }
  if (dataUrl.length <= 180_000) return dataUrl;
  return null;
}
