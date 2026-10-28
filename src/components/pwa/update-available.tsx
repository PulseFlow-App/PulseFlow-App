"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  APP_VERSION,
  CLIENT_BUILD_ID,
  compareAppVersions,
  formatAppVersion,
} from "@/lib/app-version";
import { useI18n } from "@/lib/i18n/provider";

const DISMISS_KEY = "pulseflow.updateDismissed";
const CHECK_MS = 5 * 60 * 1000;

type RemoteVersion = {
  version?: string;
  updatedAt?: string;
  buildId?: string;
};

function wasDismissed(token: string) {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === token;
  } catch {
    return false;
  }
}

function dismiss(token: string) {
  try {
    sessionStorage.setItem(DISMISS_KEY, token);
  } catch {
    /* ignore */
  }
}

export function UpdateAvailable() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissToken, setDismissToken] = useState<string | null>(null);
  const [remoteLabel, setRemoteLabel] = useState<string | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    const showFor = (
      token: string,
      label?: string | null,
      worker?: ServiceWorker,
    ) => {
      if (cancelled || wasDismissed(token)) return;
      setDismissToken(token);
      setRemoteLabel(label ?? null);
      if (worker) setWaitingWorker(worker);
      setOpen(true);
    };

    const checkVersion = async () => {
      try {
        const res = await fetch(`/api/version?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as RemoteVersion;
        const remoteBuild = (data.buildId || "").trim();
        const remoteSemver = (data.version || "").trim();

        // Every deploy: build id in the running tab ≠ server build id.
        const deployStale =
          Boolean(remoteBuild) &&
          remoteBuild !== "dev" &&
          CLIENT_BUILD_ID !== "dev" &&
          remoteBuild !== CLIENT_BUILD_ID;

        const versionBumped =
          Boolean(remoteSemver) &&
          compareAppVersions(remoteSemver, APP_VERSION) > 0;

        if (!deployStale && !versionBumped) return;

        const token = remoteBuild || remoteSemver || "update";
        const label = versionBumped
          ? data.updatedAt?.trim()
            ? formatAppVersion(remoteSemver, data.updatedAt.trim())
            : `v${remoteSemver}`
          : null;
        showFor(token, label);
      } catch {
        /* offline / ignored */
      }
    };

    const attachRegistration = (reg: ServiceWorkerRegistration) => {
      const onUpdateFound = () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showFor("sw-waiting", null, installing);
          }
        });
      };

      if (reg.waiting && navigator.serviceWorker.controller) {
        showFor("sw-waiting", null, reg.waiting);
      }
      reg.addEventListener("updatefound", onUpdateFound);

      const tick = () => {
        void reg.update().catch(() => {});
        void checkVersion();
      };
      tick();
      const id = window.setInterval(tick, CHECK_MS);
      const onVis = () => {
        if (document.visibilityState === "visible") tick();
      };
      document.addEventListener("visibilitychange", onVis);

      return () => {
        reg.removeEventListener("updatefound", onUpdateFound);
        window.clearInterval(id);
        document.removeEventListener("visibilitychange", onVis);
      };
    };

    let cleanupReg: (() => void) | undefined;

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistration().then((reg) => {
        if (cancelled || !reg) {
          void checkVersion();
          const id = window.setInterval(() => void checkVersion(), CHECK_MS);
          cleanupReg = () => window.clearInterval(id);
          return;
        }
        cleanupReg = attachRegistration(reg);
      });
    } else {
      void checkVersion();
      const id = window.setInterval(() => void checkVersion(), CHECK_MS);
      cleanupReg = () => window.clearInterval(id);
    }

    return () => {
      cancelled = true;
      cleanupReg?.();
    };
  }, [mounted]);

  const refresh = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  const later = () => {
    dismiss(dismissToken ?? (waitingWorker ? "sw-waiting" : CLIENT_BUILD_ID));
    setOpen(false);
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        aria-label={t("common.close")}
        onClick={later}
      />
      <Card
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="update-dialog-title"
        aria-describedby="update-dialog-desc"
        className="relative z-10 w-full max-w-sm space-y-5 p-5 animate-rise sm:rounded-[1.5rem]"
      >
        <div className="space-y-2">
          <h2
            id="update-dialog-title"
            className="font-display text-xl font-bold text-ink"
          >
            {t("update.title")}
          </h2>
          <p
            id="update-dialog-desc"
            className="text-sm leading-relaxed text-muted"
          >
            {t("update.description")}
            {remoteLabel ? (
              <span className="mt-1 block text-[11px] font-medium text-muted/80">
                {remoteLabel}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="primary" className="w-full" onClick={refresh}>
            {t("update.refresh")}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={later}>
            {t("update.later")}
          </Button>
        </div>
      </Card>
    </div>,
    document.body,
  );
}
