"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Trash2 } from "lucide-react";
import type { PasskeyListItem } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isDemoMode } from "@/lib/supabase/client";
import {
  deletePasskey,
  isPasskeyAvailable,
  isPasskeyEnvironmentSupported,
  listPasskeys,
  passkeyErrorMessage,
  registerPasskey,
} from "@/lib/auth/passkeys";
import { useI18n } from "@/lib/i18n/provider";
import { formatShortDate } from "@/lib/utils";

function deviceLabel() {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iPhone / iPad";
  if (/Mac/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  return "This device";
}

export function PasskeySettingsCard() {
  const { t } = useI18n();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isDemoMode() || !isPasskeyEnvironmentSupported()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await listPasskeys();
      setPasskeys(items);
    } catch (e) {
      setError(passkeyErrorMessage(e, t));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void isPasskeyAvailable().then(setSupported);
    void refresh();
  }, [refresh]);

  if (isDemoMode()) {
    return (
      <Card className="space-y-2 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("settings.passkeyTitle")}
        </h2>
        <p className="text-sm text-muted">{t("settings.passkeyDemoHint")}</p>
      </Card>
    );
  }

  if (supported === false || !isPasskeyEnvironmentSupported()) {
    return (
      <Card className="space-y-2 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("settings.passkeyTitle")}
        </h2>
        <p className="text-sm text-muted">{t("settings.passkeyUnavailable")}</p>
      </Card>
    );
  }

  const addPasskey = async () => {
    setRegistering(true);
    setMessage(null);
    setError(null);
    try {
      await registerPasskey(deviceLabel());
      setMessage(t("settings.passkeyAdded"));
      await refresh();
    } catch (e) {
      setError(passkeyErrorMessage(e, t));
    } finally {
      setRegistering(false);
    }
  };

  const removePasskey = async (passkeyId: string) => {
    setRemovingId(passkeyId);
    setMessage(null);
    setError(null);
    try {
      await deletePasskey(passkeyId);
      setMessage(t("settings.passkeyRemoved"));
      await refresh();
    } catch (e) {
      setError(passkeyErrorMessage(e, t));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Fingerprint className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            {t("settings.passkeyTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("settings.passkeyHint")}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t("common.loading")}</p>
      ) : passkeys.length > 0 ? (
        <ul className="space-y-2">
          {passkeys.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[#F7F5F1] px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {item.friendly_name?.trim() || t("settings.passkeyRegistered")}
                </p>
                {item.last_used_at ? (
                  <p className="text-xs text-muted">
                    {t("settings.passkeyLastUsed", {
                      date: formatShortDate(item.last_used_at),
                    })}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={removingId === item.id}
                aria-label={t("settings.passkeyRemove")}
                onClick={() => void removePasskey(item.id)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={registering || supported !== true}
        onClick={() => void addPasskey()}
      >
        {registering ? t("settings.passkeyAdding") : t("settings.passkeyAdd")}
      </Button>

      {message ? (
        <p className="text-sm font-semibold text-secondary">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm font-semibold text-danger">{error}</p>
      ) : null}
    </Card>
  );
}
