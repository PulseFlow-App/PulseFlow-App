"use client";

import { useSyncExternalStore } from "react";
import {
  getActionBusyCount,
  subscribeActionBusy,
} from "@/lib/ui/action-busy";

export function useActionBusy() {
  const count = useSyncExternalStore(
    subscribeActionBusy,
    getActionBusyCount,
    () => 0,
  );
  return count > 0;
}
