"use client";

import { useEffect, useState } from "react";
import { hasDemoUserCookie, isSupabaseConfigured } from "@/lib/env";

/**
 * SSR-safe demo flag. Cookie-based demo seats are only known in the browser,
 * so the first render matches the server (env only); after mount we include the cookie.
 */
export function useIsDemoMode() {
  const [demo, setDemo] = useState(() => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return false;
    return !isSupabaseConfigured();
  });

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      setDemo(true);
      return;
    }
    if (hasDemoUserCookie()) {
      setDemo(true);
      return;
    }
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") {
      setDemo(false);
      return;
    }
    setDemo(!isSupabaseConfigured());
  }, []);

  return demo;
}
