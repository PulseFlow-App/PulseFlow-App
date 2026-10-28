"use client";

import { useSyncExternalStore } from "react";
import { hasDemoUserCookie, isSupabaseConfigured } from "@/lib/env";

function subscribe() {
  // Cookie / env demo flag does not emit storage events; store is polled via
  // navigation remounts. No-op subscribe keeps useSyncExternalStore happy.
  return () => {};
}

function demoFlagClient() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  // Marketing demo seats work on production even when DEMO_MODE=false.
  if (hasDemoUserCookie()) return true;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return false;
  return !isSupabaseConfigured();
}

function demoFlagServer() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "false") return false;
  return !isSupabaseConfigured();
}

/**
 * SSR-safe demo flag. Server snapshot ignores the browser cookie; the client
 * snapshot includes it immediately (no stuck "Loading…" after hydrate).
 */
export function useIsDemoMode() {
  return useSyncExternalStore(subscribe, demoFlagClient, demoFlagServer);
}
