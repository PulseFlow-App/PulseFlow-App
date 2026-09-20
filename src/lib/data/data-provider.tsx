"use client";

import type { ReactNode } from "react";
import {
  AppDataContext,
  useAppDataStore,
} from "@/lib/data/use-app-data";

/**
 * Single shared data store for the app shell. Without this, each useData()
 * call kept its own copy — ticks looked stuck until you left and came back.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const value = useAppDataStore();
  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}
