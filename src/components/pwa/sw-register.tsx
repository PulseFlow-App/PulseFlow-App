"use client";

import { useEffect } from "react";
import { UpdateAvailable } from "@/components/pwa/update-available";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ignore registration failures in dev / unsupported contexts.
    });
  }, []);
  return <UpdateAvailable />;
}
