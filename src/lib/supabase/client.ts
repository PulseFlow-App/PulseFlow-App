/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
import { createBrowserClient } from "@supabase/ssr";
import { authCookieDomain } from "@/lib/supabase/cookie-domain";
export { isDemoMode, isSupabaseConfigured } from "@/lib/env";

export function createClient() {
  const domain = authCookieDomain(
    typeof window === "undefined" ? null : window.location.host,
  );
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(domain ? { cookieOptions: { domain } } : {}),
      auth: {
        experimental: {
          passkey: true,
        },
      },
    },
  );
}
