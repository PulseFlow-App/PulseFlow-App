/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
export const DEMO_USER_COOKIE = "pulseflow_demo_user";

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("your-project") &&
      key !== "your-anon-key",
  );
}

/** Marketing demo seats (owner/employee/guest) can run on production via cookie session. */
export function hasDemoUserCookie(cookieHeader?: string | null) {
  if (typeof cookieHeader === "string") {
    return cookieHeader
      .split(";")
      .some((part) => part.trim().startsWith(`${DEMO_USER_COOKIE}=`));
  }
  if (typeof document !== "undefined") {
    return document.cookie
      .split("; ")
      .some((row) => row.startsWith(`${DEMO_USER_COOKIE}=`));
  }
  return false;
}

export function isDemoMode(cookieHeader?: string | null) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  if (hasDemoUserCookie(cookieHeader)) return true;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return false;
  return !isSupabaseConfigured();
}

/**
 * Education mode (guided first-run tour for owners/managers).
 * Off when NEXT_PUBLIC_EDUCATION_MODE is "0" or "false"; on otherwise.
 */
export function isEducationModeEnabled() {
  const raw = process.env.NEXT_PUBLIC_EDUCATION_MODE?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  return true;
}
