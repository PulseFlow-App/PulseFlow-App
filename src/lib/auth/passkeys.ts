import type { AuthError, PasskeyListItem } from "@supabase/supabase-js";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type { MessageKey } from "@/lib/i18n";

export function isPasskeyEnvironmentSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (isDemoMode()) return false;
  if (!window.isSecureContext) return false;
  return (
    typeof PublicKeyCredential !== "undefined" &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
      "function"
  );
}

export async function isPasskeyAvailable(): Promise<boolean> {
  if (!isPasskeyEnvironmentSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function isUserCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "NotAllowedError") return true;
  const message = error.message.toLowerCase();
  return message.includes("cancel") || message.includes("abort");
}

export function mapPasskeyError(error: unknown): MessageKey {
  if (isUserCancelled(error)) return "auth.passkeyCancelled";
  if (error instanceof Error) {
    if (error.message.includes("Browser does not support WebAuthn")) {
      return "auth.passkeyNotSupported";
    }
    if (error.message.includes("Passkey support is experimental")) {
      return "auth.passkeyNotSupported";
    }
  }
  const authError = error as AuthError | null;
  if (authError?.code === "passkey_disabled") return "auth.passkeyDisabled";
  if (authError?.code === "webauthn_credential_not_found") {
    return "auth.passkeyNotRegistered";
  }
  if (authError?.code === "email_not_confirmed") {
    return "auth.passkeyEmailNotConfirmed";
  }
  if (authError?.code === "webauthn_credential_exists") {
    return "settings.passkeyAlreadyRegistered";
  }
  return "auth.passkeySignInFailed";
}

/** Prefer a specific i18n key; fall back to Supabase message for unknown errors while testing. */
export function passkeyErrorMessage(
  error: unknown,
  t: (key: MessageKey) => string,
): string {
  const key = mapPasskeyError(error);
  if (key !== "auth.passkeySignInFailed" && key !== "settings.passkeyRegisterFailed") {
    return t(key);
  }
  const authError = error as AuthError | null;
  if (authError?.message?.trim()) return authError.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return t(key);
}

export async function signInWithPasskey() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPasskey();
  if (error) throw error;
  return data;
}

export async function registerPasskey(friendlyName?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.registerPasskey();
  if (error) throw error;

  if (friendlyName && data?.id) {
    await supabase.auth.passkey.update({
      passkeyId: data.id,
      friendlyName,
    });
  }

  return data;
}

export async function listPasskeys(): Promise<PasskeyListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.passkey.list();
  if (error) throw error;
  return data ?? [];
}

export async function deletePasskey(passkeyId: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.passkey.delete({ passkeyId });
  if (error) throw error;
}
