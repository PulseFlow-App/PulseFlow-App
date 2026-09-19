"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, ChevronDown } from "lucide-react";
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
import {
  defaultPushPrefs,
  normalizePushPrefs,
  pushCategoriesForRole,
  pushCategoryHintKey,
  pushCategoryLabelKey,
  type PushCategory,
  type PushCategoryPrefs,
} from "@/lib/push/categories";
import { useI18n } from "@/lib/i18n/provider";
import { useData } from "@/lib/data/use-app-data";
import { pushHintKey } from "@/lib/settings/audience-copy";
import { cn } from "@/lib/utils";

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
  const data = useData();
  const role = data.profile?.role ?? "staff";
  const pushHint = pushHintKey(role);
  const categories = pushCategoriesForRole(role);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prefsBusy, setPrefsBusy] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [prefs, setPrefs] = useState<PushCategoryPrefs>(defaultPushPrefs);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/push/prefs", { credentials: "same-origin" });
      if (!res.ok) return;
      const payload = (await res.json()) as { prefs?: unknown };
      setPrefs(normalizePushPrefs(payload.prefs));
    } catch {
      /* keep defaults */
    }
  }, []);

  const refresh = useCallback(async () => {
    if (isDemoMode() || !isPushSupported() || !pushPublicKey()) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const sub = await getCurrentPushSubscription();
    const isSub = Boolean(sub);
    setSubscribed(isSub);
    if (isSub) await loadPrefs();
  }, [loadPrefs]);

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
      setCategoriesOpen(true);
      await loadPrefs();
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

  const toggleCategory = async (category: PushCategory, enabled: boolean) => {
    const previous = prefs;
    const next = { ...prefs, [category]: enabled };
    setPrefs(next);
    setPrefsBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/push/prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ prefs: { [category]: enabled } }),
      });
      const payload = (await res.json()) as {
        prefs?: unknown;
        error?: string;
      };
      if (!res.ok) {
        setPrefs(previous);
        setError(payload.error ?? t("common.error"));
        return;
      }
      if (payload.prefs) setPrefs(normalizePushPrefs(payload.prefs));
    } catch {
      setPrefs(previous);
      setError(t("common.error"));
    } finally {
      setPrefsBusy(false);
    }
  };

  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">
          {t("settings.pushTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t(pushHint)}</p>
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

      {subscribed ? (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-[#F7F5F1]/40">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            aria-expanded={categoriesOpen}
            onClick={() => setCategoriesOpen((open) => !open)}
          >
            <span className="text-sm font-semibold text-ink">
              {t("settings.pushCategories")}
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted transition",
                categoriesOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {categoriesOpen ? (
            <div className="space-y-2 border-t border-black/5 px-3 pb-3 pt-2">
              <p className="px-1 text-xs text-muted">
                {t("settings.pushCategoriesHint")}
              </p>
              {categories.map((category) => (
                <label
                  key={category}
                  className="flex cursor-pointer items-start justify-between gap-3 rounded-xl bg-card px-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">
                      {t(pushCategoryLabelKey(category))}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {t(pushCategoryHintKey(category))}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="mt-0.5 size-5 shrink-0 accent-primary"
                    checked={prefs[category]}
                    disabled={prefsBusy}
                    onChange={(e) =>
                      void toggleCategory(category, e.target.checked)
                    }
                    aria-label={t(pushCategoryLabelKey(category))}
                  />
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
