"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint } from "lucide-react";
import { PulseMark } from "@/components/brand/pulse-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isDemoMode } from "@/lib/supabase/client";
import {
  isPasskeyAvailable,
  isPasskeyEnvironmentSupported,
  passkeyErrorMessage,
  registerPasskey,
} from "@/lib/auth/passkeys";
import { useI18n } from "@/lib/i18n/provider";

function deviceLabel() {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iPhone / iPad";
  if (/Mac/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  return "This device";
}

/** Shown once after first registration / invite accept. */
export default function SetupPasskeyPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goHome = () => {
    router.replace("/home");
    router.refresh();
  };

  useEffect(() => {
    if (isDemoMode() || !isPasskeyEnvironmentSupported()) {
      setSupported(false);
      return;
    }
    void isPasskeyAvailable().then(setSupported);
  }, []);

  const enable = async () => {
    setBusy(true);
    setError(null);
    try {
      await registerPasskey(deviceLabel());
      goHome();
    } catch (e) {
      setError(passkeyErrorMessage(e, t));
      setBusy(false);
    }
  };

  return (
    <div className="flex h-dvh items-center justify-center overflow-y-auto bg-sand px-4 py-10">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-6 text-center">
          <PulseMark className="mx-auto mb-3 size-12" />
          <h1 className="font-display text-2xl font-bold text-ink">
            {t("auth.setupPasskeyTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted">{t("auth.setupPasskeyHint")}</p>
        </div>

        <Card className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Fingerprint className="size-5" aria-hidden />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-ink">
                {t("settings.passkeyTitle")}
              </p>
              <p className="mt-1 text-sm text-muted">
                {t("auth.setupPasskeyLater")}
              </p>
            </div>
          </div>

          {supported === false ? (
            <p className="text-sm text-muted">{t("settings.passkeyUnavailable")}</p>
          ) : null}

          {error ? (
            <p className="text-sm font-semibold text-danger">{error}</p>
          ) : null}

          <Button
            className="w-full"
            size="lg"
            disabled={busy || supported === false}
            onClick={() => void enable()}
          >
            {busy ? t("settings.passkeyAdding") : t("settings.passkeyAdd")}
          </Button>
          <Button
            className="w-full"
            size="lg"
            variant="ghost"
            disabled={busy}
            onClick={goHome}
          >
            {t("auth.setupPasskeySkip")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
