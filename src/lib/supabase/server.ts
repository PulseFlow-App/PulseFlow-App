/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { authCookieDomain } from "@/lib/supabase/cookie-domain";

export async function createClient() {
  const cookieStore = await cookies();
  const headerList = await headers();
  const domain = authCookieDomain(
    headerList.get("x-forwarded-host") ?? headerList.get("host"),
  );

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...(domain ? { cookieOptions: { domain } } : {}),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component - middleware will refresh sessions.
          }
        },
      },
    },
  );
}
