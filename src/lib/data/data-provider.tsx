"use client";

import { useMemo, type ReactNode } from "react";
import {
  AppDataContext,
  useAppDataStore,
} from "@/lib/data/use-app-data";
import { wrapAppDataWithActionBusy } from "@/lib/ui/action-busy";

/**
 * Single shared data store for the app shell. Without this, each useData()
 * call kept its own copy — ticks looked stuck until you left and came back.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const value = useAppDataStore();
  const tracked = useMemo(() => wrapAppDataWithActionBusy(value), [value]);
  return (
    <AppDataContext.Provider value={tracked}>{children}</AppDataContext.Provider>
  );
}
