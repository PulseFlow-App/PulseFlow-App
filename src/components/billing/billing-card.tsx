"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/lib/data/use-app-data";
import {
  isCompanyEntitled,
  trialDaysRemaining,
} from "@/lib/billing/entitlement";
import { isDemoMode } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";

export function BillingSettingsCard() {
  const data = useData();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!data.profile || data.profile.role !== "owner") return null;
  if (data.orgKind !== "company") return null;

  const org = data.organization;
  const days = trialDaysRemaining(org?.trial_ends_at);
  const entitled = isCompanyEntitled(org);
  const status = org?.subscription_status ?? "none";

  const startCheckout = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const payload = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !payload.url) {
        throw new Error(payload.error ?? t("common.error"));
      }
      window.location.href = payload.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
      setBusy(false);
    }
  };

  const openPortal = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const payload = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !payload.url) {
        throw new Error(payload.error ?? t("common.error"));
      }
      window.location.href = payload.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">
          {t("billing.title")}
        </h2>
        <p className="mt-1 text-sm text-muted" dir="auto">
          {t("billing.subtitle")}
        </p>
      </div>

      <div className="rounded-2xl bg-[#F7F5F1] px-3 py-3 text-sm">
        <div className="flex justify-between gap-3 py-1">
          <span className="text-muted">{t("billing.status")}</span>
          <span className="font-semibold capitalize text-ink">{status}</span>
        </div>
        {days != null ? (
          <div className="flex justify-between gap-3 py-1">
            <span className="text-muted">{t("billing.trial")}</span>
            <span className="font-semibold text-ink">
              {days > 0
                ? t("billing.daysLeft", { count: days })
                : t("billing.ended")}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between gap-3 py-1">
          <span className="text-muted">{t("billing.writesEnabled")}</span>
          <span className="font-semibold text-ink">
            {entitled ? t("billing.yes") : t("billing.readOnly")}
          </span>
        </div>
      </div>

      {isDemoMode() ? (
        <p className="text-sm text-muted">{t("billing.demoHint")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {status === "active" || status === "trialing" ? (
            <Button
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={() => void openPortal()}
            >
              {busy ? t("billing.opening") : t("billing.manage")}
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => void startCheckout()}
            >
              {busy ? t("billing.redirecting") : t("billing.subscribe")}
            </Button>
          )}
          {!entitled ? (
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => void startCheckout()}
            >
              {t("billing.restore")}
            </Button>
          ) : null}
        </div>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <p className="text-xs text-muted">
        <a
          href="https://pulseflow.site/subscription"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary"
        >
          {t("plan.seePlans")}
        </a>
        {" · "}
        <Link href="/terms" className="font-semibold text-primary">
          {t("billing.terms")}
        </Link>
        {" · "}
        <Link href="/privacy" className="font-semibold text-primary">
          {t("billing.privacy")}
        </Link>
      </p>
    </Card>
  );
}

export function TrialBanner() {
  const data = useData();
  const { t } = useI18n();
  if (!data.profile || data.orgKind !== "company") return null;
  if (data.profile.role !== "owner" && data.companyEntitled) return null;

  const days = trialDaysRemaining(data.organization?.trial_ends_at);
  const entitled = data.companyEntitled;

  if (entitled && (days == null || days > 7)) return null;

  return (
    <div
      className={`mb-3 rounded-2xl px-3 py-2.5 text-sm ${
        entitled ? "bg-primary-soft text-ink" : "bg-danger/10 text-danger"
      }`}
    >
      {entitled ? (
        <p dir="auto">
          {t("billing.trialBanner", { count: days ?? 0 })}{" "}
          <Link href="/settings" className="font-semibold underline">
            {t("billing.review")}
          </Link>
        </p>
      ) : (
        <p dir="auto">
          {t("billing.endedBanner")}{" "}
          {data.profile.role === "owner" ? (
            <Link href="/settings" className="font-semibold underline">
              {t("billing.subscribeNow")}
            </Link>
          ) : (
            <span>{t("billing.askOwner")}</span>
          )}
        </p>
      )}
    </div>
  );
}
