import type { SupabaseClient } from "@supabase/supabase-js";
import { decodeAccountLogo } from "@/lib/auth/logo";

/** Store a chat photo. A short data URL is kept if the bucket is not ready. */
export async function storeChatPhoto(
  admin: SupabaseClient,
  requestId: string,
  dataUrl: string,
): Promise<string | null> {
  const parsed = decodeAccountLogo(dataUrl);
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
