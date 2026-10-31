import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * AES-256-GCM for org integration secrets.
 * Prefer INTEGRATION_SECRETS_KEY (32+ chars). Falls back to a hash of
 * SUPABASE_SERVICE_ROLE_KEY so local/prod without a dedicated key still works.
 */
function secretKeyBytes(): Buffer {
  const raw =
    process.env.INTEGRATION_SECRETS_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";
  if (!raw) {
    throw new Error(
      "Missing INTEGRATION_SECRETS_KEY (or SUPABASE_SERVICE_ROLE_KEY) for encryption",
    );
  }
  return createHash("sha256").update(raw).digest();
}

/** Returns `iv:ciphertext:tag` as base64 segments. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKeyBytes(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${enc.toString("base64")}:${tag.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const [ivB64, dataB64, tagB64] = payload.split(":");
  if (!ivB64 || !dataB64 || !tagB64) {
    throw new Error("Invalid ciphertext");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    secretKeyBytes(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
