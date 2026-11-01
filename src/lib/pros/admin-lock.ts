import { createHmac, timingSafeEqual } from "node:crypto";

/** HttpOnly cookie. The admin key itself never goes in this value. */
export const ADMIN_COOKIE = "pf_services_admin";

const TOKEN_LABEL = "pf-services-admin-v1";

export function adminKey() {
  return process.env.PROS_ADMIN_KEY?.trim() ?? "";
}

function mac(value: string) {
  return createHmac("sha256", "pf-services-admin").update(value).digest();
}

/** Compare the typed string with the server key. Length is not revealed. */
export function keyMatches(input: string) {
  const secret = adminKey();
  const typed = input.trim();
  if (!secret || !typed) return false;
  return timingSafeEqual(mac(typed), mac(secret));
}

/** The second credential must be the word admin. */
export function wordMatches(input: string) {
  const typed = input.trim().toLowerCase();
  if (!typed) return false;
  return timingSafeEqual(mac(typed), mac("admin"));
}

export function adminToken() {
  const secret = adminKey();
  if (!secret) return "";
  return createHmac("sha256", secret).update(TOKEN_LABEL).digest("hex");
}

export function tokenMatches(cookie: string | undefined) {
  const expected = adminToken();
  if (!expected || !cookie) return false;
  const left = Buffer.from(cookie);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}
