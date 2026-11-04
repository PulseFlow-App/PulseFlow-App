"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { prosT, type ProsKey } from "@/lib/pros/i18n";

type LinkState = {
  choice: "merged" | "separate" | null;
  prompt: boolean;
  secondApp: "services" | "pulse" | null;
  companyName: string | null;
};

export function LinkOffer({
  app,
  variant = "dialog",
}: {
  app: "services" | "pulse";
  variant?: "dialog" | "settings";
}) {
  const { locale } = useI18n();
  const t = (key: ProsKey, params?: Record<string, string | number>) => prosT(locale, key, params);
  const [state, setState] = useState<LinkState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/account/link", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: LinkState | null) => {
        if (!cancelled) setState(payload);
      })
      .catch(() => {
        if (!cancelled) setState(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function choose(choice: "merged" | "separate") {
    setBusy(true);
    try {
      const res = await fetch("/api/account/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });
      if (!res.ok) return;
      setState((current) => (current ? { ...current, choice, prompt: false } : current));
      window.dispatchEvent(new Event("account-link"));
    } finally {
      setBusy(false);
    }
  }

  if (!state) return null;

  if (variant === "settings") {
    if (state.choice !== "separate") return null;
    return (
      <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
        <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("linkMerge")}</h2>
        <p className="text-pf-16 leading-relaxed text-pf-text-secondary">
          {app === "services"
            ? t("linkBodyServices", { company: state.companyName || "Pulse Flow" })
            : t("linkBodyPulse")}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void choose("merged")}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-pf-pill border border-pf-line px-4 text-pf-16 font-medium text-pf-ink"
        >
          {t("linkMerge")}
        </button>
      </section>
    );
  }

  if (!state.prompt || state.secondApp !== app) return null;
  const title = app === "services" ? t("linkTitleServices") : t("linkTitlePulse");
  const body =
    app === "services"
      ? t("linkBodyServices", { company: state.companyName || "Pulse Flow" })
      : t("linkBodyPulse");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-pf-navy-900/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-link-title"
        className="w-full max-w-md space-y-3 rounded-[28px] bg-pf-card p-5 text-pf-ink shadow-none"
      >
        <h2 id="account-link-title" className="text-pf-22 font-bold tracking-[-0.02em]">
          {title}
        </h2>
        <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{body}</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void choose("merged")}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-pf-pill bg-pf-orange-500 px-4 text-pf-16 font-medium text-white"
        >
          {t("linkMerge")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void choose("separate")}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-pf-pill border border-pf-line px-4 text-pf-16 font-medium text-pf-ink"
        >
          {t("linkSeparate")}
        </button>
      </div>
    </div>
  );
}
