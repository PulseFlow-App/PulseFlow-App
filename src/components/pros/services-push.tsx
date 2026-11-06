"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { isDemoMode } from "@/lib/env";
import {
  disablePushOnThisDevice,
  enablePushOnThisDevice,
  getCurrentPushSubscription,
  isPushSupported,
  pushPublicKey,
} from "@/lib/push/client";
import { usePros } from "@/lib/pros/store";
import { cn } from "@/lib/utils";

function isIosBrowser() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && /WebKit/.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

/** On/off for lock-screen alerts. Not orange: the screen may already have one orange control. */
export function ServicesPushToggle() {
  const { t } = usePros();
  const { t: appT } = useI18n();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isDemoMode() || !isPushSupported() || !pushPublicKey()) {
      setSupported(false);
      return;
    }
    setSupported(true);
    setOn(Boolean(await getCurrentPushSubscription()));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const iosNeedsHomeScreen = isIosBrowser() && !isStandalone();

  const choose = async (next: boolean) => {
    if (busy || next === on) return;
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      if (next) {
        await enablePushOnThisDevice();
        setOn(true);
        setNote(appT("settings.pushEnabled"));
      } else {
        await disablePushOnThisDevice();
        setOn(false);
        setNote(appT("settings.pushDisabled"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : appT("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-2 rounded-[20px] border border-pf-line bg-pf-card p-4">
      <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("pushTitle")}</h2>
      <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("pushHint")}</p>
      {supported === false ? <p className="text-pf-14 text-pf-text-secondary">{appT("settings.pushUnavailable")}</p> : null}
      {iosNeedsHomeScreen ? <p className="text-pf-14 leading-relaxed text-pf-text-secondary">{appT("settings.pushIosHint")}</p> : null}
      {supported ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={busy || iosNeedsHomeScreen}
            onClick={() => void choose(true)}
            className={cn(
              "min-h-11 rounded-full px-3 text-pf-14 font-medium disabled:opacity-60",
              on ? "bg-pf-peach-100 text-pf-ink" : "border border-pf-line bg-pf-card text-pf-ink",
            )}
          >
            {busy && !on ? appT("settings.pushWorking") : t("pushOn")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void choose(false)}
            className={cn(
              "min-h-11 rounded-full px-3 text-pf-14 font-medium disabled:opacity-60",
              on ? "border border-pf-line bg-pf-card text-pf-ink" : "bg-pf-peach-100 text-pf-ink",
            )}
          >
            {busy && on ? appT("settings.pushWorking") : t("pushOff")}
          </button>
        </div>
      ) : null}
      {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
      {note ? <p className="text-pf-14 font-medium text-pf-ink">{note}</p> : null}
    </section>
  );
}
