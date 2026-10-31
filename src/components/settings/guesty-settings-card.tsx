"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { isDemoMode } from "@/lib/supabase/client";
import { formatShortDate } from "@/lib/utils";

type GuestyStatus = {
  connected?: boolean;
  demo?: boolean;
  needsMigration?: boolean;
  status?: string;
  lastError?: string | null;
  lastSyncAt?: string | null;
  listingsSynced?: number;
  error?: string;
};

/**
 * Company Owner/Manager: paste Guesty Open API Client ID + Secret,
 * then sync listings into Pulse properties + calendars.
 */
export function GuestySettingsCard() {
  const { t } = useI18n();
  const data = useData();
  const role = data.profile?.role;
  const isCompany = data.orgKind === "company";
  const allowed =
    isCompany && (role === "owner" || role === "manager");

  const [status, setStatus] = useState<GuestyStatus | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!allowed) return;
    try {
      const res = await fetch("/api/integrations/guesty", {
        credentials: "same-origin",
      });
      const payload = (await res.json()) as GuestyStatus;
      if (!res.ok) throw new Error(payload.error ?? t("common.error"));
      setStatus(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    }
  }, [allowed, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!allowed) return null;

  if (isDemoMode()) {
    return (
      <Card id="guesty" className="scroll-mt-4 space-y-2 p-3 sm:p-4">
        <h2 className="font-display text-base font-bold text-ink">
          {t("guesty.title")}
        </h2>
        <p className="text-sm text-ink/70">{t("guesty.demoHint")}</p>
      </Card>
    );
  }

  const connect = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/guesty", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? t("guesty.connectFail"));
      setClientSecret("");
      setMessage(t("guesty.connectOk"));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("guesty.connectFail"));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm(t("guesty.disconnectConfirm"))) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/guesty", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? t("common.error"));
      setMessage(t("guesty.disconnected"));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const sync = async () => {
    setSyncBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/integrations/guesty/sync", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await res.json()) as {
        error?: string;
        summary?: {
          listingsSeen: number;
          created: number;
          updated: number;
          calendarsSynced: number;
          errors: string[];
        };
      };
      if (!res.ok) throw new Error(payload.error ?? t("guesty.syncFail"));
      const s = payload.summary;
      setMessage(
        t("guesty.syncOk", {
          seen: s?.listingsSeen ?? 0,
          created: s?.created ?? 0,
          updated: s?.updated ?? 0,
          calendars: s?.calendarsSynced ?? 0,
        }),
      );
      if (s?.errors?.length) {
        setError(s.errors.slice(0, 3).join(" · "));
      }
      await load();
      if (typeof data.refresh === "function") await data.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("guesty.syncFail"));
    } finally {
      setSyncBusy(false);
    }
  };

  const connected = Boolean(status?.connected);

  return (
    <Card id="guesty" className="scroll-mt-4 space-y-3 p-3 sm:p-4">
      <div>
        <h2 className="font-display text-base font-bold text-ink">
          {t("guesty.title")}
        </h2>
        <p className="mt-0.5 text-sm text-ink/70">{t("guesty.hint")}</p>
      </div>

      {status?.needsMigration ? (
        <p className="pf-panel-soft rounded-xl px-3 py-2 text-sm text-ink">
          {t("guesty.needsMigration")}
        </p>
      ) : null}

      {connected ? (
        <div className="pf-panel-soft space-y-1 rounded-xl px-3 py-2 text-sm">
          <p className="font-semibold text-ink">{t("guesty.connected")}</p>
          {status?.lastSyncAt ? (
            <p className="text-ink/70">
              {t("guesty.lastSync", {
                when: formatShortDate(status.lastSyncAt.slice(0, 10)),
                count: status.listingsSynced ?? 0,
              })}
            </p>
          ) : (
            <p className="text-ink/70">{t("guesty.readyToSync")}</p>
          )}
          {status?.lastError ? (
            <p className="text-sm text-danger">{status.lastError}</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <Label htmlFor="guesty-client-id">{t("guesty.clientId")}</Label>
            <Input
              id="guesty-client-id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <Label htmlFor="guesty-client-secret">
              {t("guesty.clientSecret")}
            </Label>
            <Input
              id="guesty-client-secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <p className="text-xs text-ink/65">{t("guesty.whereKeys")}</p>
        </div>
      )}

      {error ? (
        <p className="text-sm font-semibold text-danger">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm font-semibold text-ink">{message}</p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {connected ? (
          <>
            <Button
              className="flex-1"
              size="sm"
              busy={syncBusy}
              onClick={() => void sync()}
            >
              {t("guesty.syncNow")}
            </Button>
            <Button
              className="flex-1"
              size="sm"
              variant="ghost"
              disabled={busy || syncBusy}
              onClick={() => void disconnect()}
            >
              {t("guesty.disconnect")}
            </Button>
          </>
        ) : (
          <Button
            className="w-full"
            size="sm"
            busy={busy}
            disabled={!clientId.trim() || !clientSecret.trim()}
            onClick={() => void connect()}
          >
            {t("guesty.connect")}
          </Button>
        )}
      </div>
    </Card>
  );
}
