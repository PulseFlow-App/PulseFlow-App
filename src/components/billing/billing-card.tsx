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

export function BillingSettingsCard() {
  const data = useData();
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
        throw new Error(payload.error ?? "Could not start checkout.");
      }
      window.location.href = payload.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Billing error.");
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
        throw new Error(payload.error ?? "Could not open billing portal.");
      }
      window.location.href = payload.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Billing error.");
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Billing</h2>
        <p className="mt-1 text-sm text-muted">
          Company plans include a 30-day free trial. Personal workspaces stay
          free. Only the owner is billed.
        </p>
      </div>

      <div className="rounded-2xl bg-[#F7F5F1] px-3 py-3 text-sm">
        <div className="flex justify-between gap-3 py-1">
          <span className="text-muted">Status</span>
          <span className="font-semibold capitalize text-ink">{status}</span>
        </div>
        {days != null ? (
          <div className="flex justify-between gap-3 py-1">
            <span className="text-muted">Trial</span>
            <span className="font-semibold text-ink">
              {days > 0 ? `${days} day${days === 1 ? "" : "s"} left` : "Ended"}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between gap-3 py-1">
          <span className="text-muted">Writes enabled</span>
          <span className="font-semibold text-ink">
            {entitled ? "Yes" : "Read-only"}
          </span>
        </div>
      </div>

      {isDemoMode() ? (
        <p className="text-sm text-muted">
          Billing checkout runs when Supabase + Stripe are connected (demo mode
          skips payments).
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {status === "active" || status === "trialing" ? (
            <Button
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={() => void openPortal()}
            >
              {busy ? "Opening…" : "Manage plan"}
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => void startCheckout()}
            >
              {busy ? "Redirecting…" : "Subscribe"}
            </Button>
          )}
          {!entitled ? (
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => void startCheckout()}
            >
              Restore access
            </Button>
          ) : null}
        </div>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <p className="text-xs text-muted">
        See{" "}
        <Link href="/terms" className="font-semibold text-primary">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-semibold text-primary">
          Privacy
        </Link>
        .
      </p>
    </Card>
  );
}

export function TrialBanner() {
  const data = useData();
  if (!data.profile || data.orgKind !== "company") return null;
  if (data.profile.role !== "owner" && data.companyEntitled) return null;

  const days = trialDaysRemaining(data.organization?.trial_ends_at);
  const entitled = data.companyEntitled;

  if (entitled && (days == null || days > 7)) return null;

  return (
    <div
      className={`mb-3 rounded-2xl px-3 py-2.5 text-sm ${
        entitled
          ? "bg-primary-soft text-ink"
          : "bg-danger/10 text-danger"
      }`}
    >
      {entitled ? (
        <p>
          Company trial ends in {days} day{days === 1 ? "" : "s"}.{" "}
          <Link href="/settings" className="font-semibold underline">
            Review billing
          </Link>
        </p>
      ) : (
        <p>
          Company trial ended - create/invite/order are paused until the owner
          subscribes.{" "}
          {data.profile.role === "owner" ? (
            <Link href="/settings" className="font-semibold underline">
              Subscribe now
            </Link>
          ) : (
            <span>Ask your owner to renew.</span>
          )}
        </p>
      )}
    </div>
  );
}
