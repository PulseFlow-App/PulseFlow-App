"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useData } from "@/lib/data/use-app-data";
import {
  isCompanyEntitled,
  trialDaysRemaining,
} from "@/lib/billing/entitlement";
import { COMPANY_TRIAL_DAYS } from "@/lib/auth/helpers";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function BillingSettingsCard({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const data = useData();
  const { t } = useI18n();

  if (!data.profile || data.profile.role !== "owner") return null;
  if (data.orgKind !== "company") return null;

  const org = data.organization;
  const days = trialDaysRemaining(org?.trial_ends_at);
  const entitled = isCompanyEntitled(org);
  const status = org?.subscription_status ?? "none";

  const body = (
    <>
      {!embedded ? (
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            {t("billing.title")}
          </h2>
          <p className="mt-1 text-sm text-muted" dir="auto">
            {t("billing.subtitle")}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted" dir="auto">
          {t("billing.subtitle")}
        </p>
      )}

      <div className="rounded-[var(--radius-control)] bg-sand px-3 py-3 text-sm">
        <div className="flex justify-between gap-3 py-1">
          <span className="text-muted">{t("billing.status")}</span>
          <span className="font-semibold capitalize text-ink">{status}</span>
        </div>
        {days != null ? (
          <div className="flex justify-between gap-3 py-1">
            <span className="text-muted">{t("billing.trial")}</span>
            <span className="font-semibold text-ink">
              {days > 0
                ? days > COMPANY_TRIAL_DAYS
                  ? t("billing.daysLeft", { count: days })
                  : t("billing.daysLeftOf", {
                      count: days,
                      total: COMPANY_TRIAL_DAYS,
                    })
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

      <p className="text-sm text-muted" dir="auto">
        {t("billing.appStoreHint")}
      </p>

      <p className="text-xs text-muted">
        <Link href="/terms" className="font-semibold text-primary">
          {t("billing.terms")}
        </Link>
        {" · "}
        <Link href="/privacy" className="font-semibold text-primary">
          {t("billing.privacy")}
        </Link>
      </p>
    </>
  );

  if (embedded) {
    return <div className="space-y-3 border-t border-black/5 pt-3">{body}</div>;
  }

  return <Card className={cn("space-y-3 p-5")}>{body}</Card>;
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
