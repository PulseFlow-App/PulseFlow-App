"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

function inAppDisplay() {
  const media = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const iosStandalone =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return Boolean(media || iosStandalone);
}

function clearFlag() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("openApp")) return;
  url.searchParams.delete("openApp");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}

/** After an email link opens the browser, offer the installed app. */
export function OpenInAppModal() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("openApp") !== "1") return;
    if (inAppDisplay()) {
      clearFlag();
      return;
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const stay = () => {
    clearFlag();
    setOpen(false);
  };

  const openApp = () => {
    const here = new URL(window.location.href);
    const inside = new URL(here.href);
    inside.searchParams.delete("openApp");
    const android = /Android/i.test(navigator.userAgent);
    if (!android) {
      setIosHint(true);
      return;
    }
    const path = `${inside.host}${inside.pathname}${inside.search}${inside.hash}`;
    const intent = `intent://${path}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${encodeURIComponent(here.toString())};end`;
    window.location.href = intent;
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-pf-ink/40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center">
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="open-app-title"
        className="relative z-10 w-full max-w-md rounded-[28px] p-5"
      >
        <h2 id="open-app-title" className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">
          {t("pwa.openInAppTitle")}
        </h2>
        <p className="mt-2 text-pf-14 leading-relaxed text-pf-text-secondary">{t("pwa.openInAppBody")}</p>
        {iosHint ? (
          <p className="mt-3 text-pf-14 leading-relaxed text-pf-ink">{t("pwa.openInAppIos")}</p>
        ) : null}
        <Button type="button" className="mt-4 w-full min-h-12" onClick={openApp} reflectGlobalBusy={false}>
          {t("pwa.openInAppAction")}
        </Button>
        <button
          type="button"
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center text-pf-14 font-medium text-pf-text-secondary"
          onClick={stay}
        >
          {t("pwa.openInAppStay")}
        </button>
      </Card>
    </div>,
    document.body,
  );
}
