"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isDemoMode } from "@/lib/supabase/client";
import {
  disablePushOnThisDevice,
  enablePushOnThisDevice,
  getCurrentPushSubscription,
  isPushSupported,
  pushPublicKey,
} from "@/lib/push/client";
import { useI18n } from "@/lib/i18n/provider";

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  return iOS && webkit;
}

function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function PushSettingsCard() {
  const { t } = useI18n();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isDemoMode() || !isPushSupported() || !pushPublicKey()) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const sub = await getCurrentPushSubscription();
    setSubscribed(Boolean(sub));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (isDemoMode()) {
    return (
      <Card className="space-y-2 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("settings.pushTitle")}
        </h2>
        <p className="text-sm text-muted">{t("settings.pushDemoHint")}</p>
      </Card>
    );
  }

  if (supported === false || !pushPublicKey()) {
    return (
      <Card className="space-y-2 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("settings.pushTitle")}
        </h2>
        <p className="text-sm text-muted">{t("settings.pushUnavailable")}</p>
      </Card>
    );
  }

  const iosNeedsInstall = isIosSafari() && !isStandalonePwa();

  const enable = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await enablePushOnThisDevice();
      setSubscribed(true);
      setMessage(t("settings.pushEnabled"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await disablePushOnThisDevice();
      setSubscribed(false);
      setMessage(t("settings.pushDisabled"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">
          {t("settings.pushTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("settings.pushHint")}</p>
      </div>

      {iosNeedsInstall ? (
        <p className="rounded-2xl bg-[#F7F5F1] px-3 py-2 text-sm text-muted">
          {t("settings.pushIosHint")}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm font-semibold text-danger">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm font-semibold text-secondary">{message}</p>
      ) : null}

      {subscribed ? (
        <Button
          variant="ghost"
          className="w-full"
          disabled={busy}
          onClick={() => void disable()}
        >
          <BellOff className="size-4" />
          {busy ? t("settings.pushWorking") : t("settings.pushDisable")}
        </Button>
      ) : (
        <Button
          className="w-full"
          disabled={busy || iosNeedsInstall}
          onClick={() => void enable()}
        >
          <Bell className="size-4" />
          {busy ? t("settings.pushWorking") : t("settings.pushEnable")}
        </Button>
      )}
    </Card>
  );
}
