"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NEXT = new Set(["/", "/settings", "/setup-passkey", "/home"]);

/** Supabase's own confirmation email returns the session in the URL hash. */
export function EmailLinkSession() {
  const router = useRouter();

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    const requested = new URLSearchParams(window.location.search).get("next");
    const services = window.location.hostname.startsWith("services.");
    const next = requested && NEXT.has(requested) ? requested : services ? "/" : "/home";
    let cancel = false;

    void (async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error || cancel) return;
      await fetch("/api/auth/confirm-complete", { method: "POST" });
      if (cancel) return;
      window.history.replaceState(null, "", next);
      router.replace(next);
      router.refresh();
    })();

    return () => {
      cancel = true;
    };
  }, [router]);

  return null;
}
