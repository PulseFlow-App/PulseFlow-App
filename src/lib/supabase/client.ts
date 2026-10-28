/**
 * Copyright (c) 2026 Anastasia Boltrushevich / Pulse Flow. All rights reserved.
 */
import { createBrowserClient } from "@supabase/ssr";
export { isDemoMode, isSupabaseConfigured } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        experimental: {
          passkey: true,
        },
      },
    },
  );
}
