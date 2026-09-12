"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { DisplayCurrencySelect } from "@/components/billing/display-currency-select";
import { BillingSettingsCard } from "@/components/billing/billing-card";
import { PasskeySettingsCard } from "@/components/auth/passkey-settings-card";
import { JobSearchSettingsCard } from "@/components/settings/job-search-settings-card";
import { PushSettingsCard } from "@/components/settings/push-settings-card";
import { TranslateContentSettingsCard } from "@/components/settings/translate-content-settings-card";
import type { MessageKey } from "@/lib/i18n";
import { resolvePlanTier, referralRegisterUrl } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const data = useData();
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState("");
  const [nameEditing, setNameEditing] = useState(false);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgEditing, setOrgEditing] = useState(false);
  const [orgBusy, setOrgBusy] = useState(false);
  const [orgMsg, setOrgMsg] = useState<string | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);

  if (!data.ready || !data.profile) return <LoadingState />;
  const profile = data.profile;
  const isCompany = data.orgKind === "company";
  const isPersonal = data.orgKind === "personal";
  const canRenameOrg = profile.role === "owner";

  const roleKey = `roles.${profile.role}` as MessageKey;
  const plan = resolvePlanTier({
    role: profile.role,
    orgKind: data.orgKind,
    organization: data.organization,
  });
  const isGuest = profile.role === "guest";
  const planNote = t(plan.noteKey);

  const saveDisplayName = async () => {
    setNameBusy(true);
    setNameMsg(null);
    try {
      await data.updateProfileName(displayName);
      setNameEditing(false);
      setNameMsg(t("settings.displayNameSaved"));
    } catch (e) {
      setNameMsg(e instanceof Error ? e.message : t("settings.saveError"));
    } finally {
      setNameBusy(false);
    }
  };

  const saveOrgName = async () => {
    setOrgBusy(true);
    setOrgMsg(null);
    try {
      await data.updateOrganizationName(orgName);
      setOrgEditing(false);
      setOrgMsg(t("settings.companyNameSaved"));
    } catch (e) {
      setOrgMsg(e instanceof Error ? e.message : t("settings.saveError"));
    } finally {
      setOrgBusy(false);
    }
  };

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-muted">{t("brand.tagline")}</p>
      </div>

      <Card id="language" className="scroll-mt-4 space-y-3 p-5">
        <LanguageSwitcher hideHint={isGuest} />
        <div className="space-y-2 border-t border-[#EDE8E0] pt-3">
          <div>
            <p className="text-sm font-bold text-ink">{t("bills.currency")}</p>
            {!isGuest && t("bills.displayCurrencyHint") ? (
              <p className="text-xs text-muted">{t("bills.displayCurrencyHint")}</p>
            ) : null}
          </div>
          <DisplayCurrencySelect aria-label={t("bills.currency")} />
        </div>
        <TranslateContentSettingsCard />
      </Card>

      <Card className="space-y-3 p-5">
        <div>
          <Label>{t("common.name")}</Label>
          {nameEditing ? (
            <div className="mt-1 space-y-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={nameBusy || !displayName.trim()}
                  onClick={() => void saveDisplayName()}
                >
                  {nameBusy ? t("common.saving") : t("common.save")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  disabled={nameBusy}
                  onClick={() => {
                    setNameEditing(false);
                    setNameMsg(null);
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-semibold text-ink">{profile.full_name}</p>
              <button
                type="button"
                className="shrink-0 text-sm font-semibold text-primary"
                onClick={() => {
                  setDisplayName(profile.full_name);
                  setNameEditing(true);
                  setNameMsg(null);
                }}
              >
                {t("common.edit")}
              </button>
            </div>
          )}
          {nameMsg ? (
            <p className="mt-1 text-sm font-semibold text-secondary">{nameMsg}</p>
          ) : null}
        </div>

        <Info label={t("common.email")} value={profile.email} />
        {isCompany ? (
          <Info label={t("common.role")} value={t(roleKey)} />
        ) : null}

        {profile.share_slug ? (
          <div className="space-y-2 border-t border-[#EDE8E0] pt-3">
            <p className="text-sm font-bold text-ink">{t("plan.referralTitle")}</p>
            <p className="text-xs text-muted">{t("plan.referralHint")}</p>
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => {
                const url = referralRegisterUrl(
                  window.location.origin,
                  profile.share_slug,
                  { src: "app_profile_referral" },
                );
                void navigator.clipboard.writeText(url).then(() => {
                  setReferralCopied(true);
                  window.setTimeout(() => setReferralCopied(false), 2000);
                });
              }}
            >
              {referralCopied ? t("plan.referralCopied") : t("plan.copyReferral")}
            </Button>
          </div>
        ) : null}

        {canRenameOrg ? (
          <div>
            <Label>
              {isPersonal ? t("settings.workspace") : t("settings.organization")}
            </Label>
            {isCompany ? (
              <p className="mt-0.5 text-xs text-muted">
                {t("settings.orgNameHint")}
              </p>
            ) : null}
            {orgEditing ? (
              <div className="mt-1 space-y-2">
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  autoComplete="organization"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={orgBusy || !orgName.trim()}
                    onClick={() => void saveOrgName()}
                  >
                    {orgBusy ? t("common.saving") : t("common.save")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                    disabled={orgBusy}
                    onClick={() => {
                      setOrgEditing(false);
                      setOrgMsg(null);
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-semibold text-ink">{data.orgName}</p>
                <button
                  type="button"
                  className="shrink-0 text-sm font-semibold text-primary"
                  onClick={() => {
                    setOrgName(data.orgName);
                    setOrgEditing(true);
                    setOrgMsg(null);
                  }}
                >
                  {t("common.edit")}
                </button>
              </div>
            )}
            {orgMsg ? (
              <p className="mt-1 text-sm font-semibold text-secondary">{orgMsg}</p>
            ) : null}
          </div>
        ) : (
          <Info
            label={
              isPersonal ? t("settings.workspace") : t("settings.organization")
            }
            value={data.orgName}
          />
        )}
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {t("plan.title")}
            </h2>
            {planNote ? (
              <p className="mt-1 text-sm text-muted">{planNote}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
                plan.tier === "full" || plan.tier === "trial"
                  ? "bg-primary-soft text-primary-dark"
                  : plan.tier === "expired"
                    ? "bg-danger/10 text-danger"
                    : "bg-[#F7F5F1] text-ink",
              )}
            >
              <NotebookPen className="size-3.5" />
              {t(plan.labelKey)}
            </span>
            {isGuest ? (
              <span className="text-xs font-semibold text-muted">
                {t("plan.guestFree")}
              </span>
            ) : null}
          </div>
        </div>
        <BillingSettingsCard embedded />
      </Card>

      <PasskeySettingsCard hideHint={isGuest} />

      <PushSettingsCard />

      {profile.role !== "owner" ? (
        <div id="talent-profile" className="scroll-mt-4">
          <JobSearchSettingsCard />
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="font-semibold text-ink">{value}</p>
    </div>
  );
}
