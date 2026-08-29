"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, NotebookPen, Star, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { isDemoMode, createClient } from "@/lib/supabase/client";
import { demoLogout } from "@/lib/demo/store";
import { brand } from "@/lib/design-tokens";
import {
  canInviteAnyone,
  canManageVillaAssignments,
} from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { BillingSettingsCard } from "@/components/billing/billing-card";
import { PasskeySettingsCard } from "@/components/auth/passkey-settings-card";
import { JobSearchSettingsCard } from "@/components/settings/job-search-settings-card";
import { PushSettingsCard } from "@/components/settings/push-settings-card";
import { InviteFlipCards } from "@/components/settings/invite-flip-cards";
import type { MessageKey } from "@/lib/i18n";
import {
  resolvePlanTier,
} from "@/lib/billing/plans";
import { canUseManagerReporting } from "@/lib/billing/reporting";
import type { ReferralProgress } from "@/lib/billing/referrals";
import { cn, formatShortDate } from "@/lib/utils";

export default function SettingsPage() {
  const data = useData();
  const router = useRouter();
  const { t } = useI18n();
  const [copiedShare, setCopiedShare] = useState(false);
  const [assignManagerId, setAssignManagerId] = useState("");
  const [selectedVillas, setSelectedVillas] = useState<string[]>([]);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const [referralProgress, setReferralProgress] =
    useState<ReferralProgress | null>(null);

  const isCompany = data.orgKind === "company";
  const isPersonal = data.orgKind === "personal";

  const assignablePeople = useMemo(
    () =>
      data.profiles.filter(
        (p) =>
          (p.role === "cleaner" || p.role === "staff") &&
          p.id !== data.profile?.id,
      ),
    [data.profiles, data.profile?.id],
  );

  const showInvitePanel = !!data.profile && canInviteAnyone(data.profile.role);

  useEffect(() => {
    if (!showInvitePanel) return;
    void fetch("/api/referrals/progress")
      .then((r) => r.json())
      .then((payload) => setReferralProgress(payload as ReferralProgress))
      .catch(() => setReferralProgress(null));
  }, [showInvitePanel]);

  useEffect(() => {
    if (!data.ready || !data.profile) return;
    if (data.profile.role === "owner") return;
    if (data.profile.share_slug?.trim()) return;
    void fetch("/api/profile/share-slug", { method: "POST" })
      .then((r) => r.json())
      .then((payload: { share_slug?: string | null }) => {
        if (payload.share_slug) void data.refresh();
      })
      .catch(() => undefined);
  }, [
    data.ready,
    data.profile?.id,
    data.profile?.role,
    data.profile?.share_slug,
    data.refresh,
  ]);

  if (!data.ready || !data.profile) return <LoadingState />;
  const profile = data.profile;
  const publicShareSlug = profile.share_slug?.trim() ?? null;
  const referralCode = profile.share_slug?.trim() || profile.id.slice(0, 8);

  const signOut = async () => {
    if (isDemoMode()) {
      demoLogout();
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.replace("/login");
    router.refresh();
  };

  const loadAssignments = (managerId: string) => {
    setAssignManagerId(managerId);
    const current = data.villaAssignments
      .filter((a) => a.profile_id === managerId)
      .map((a) => a.villa_id);
    setSelectedVillas(current);
    setAssignMsg(null);
  };

  const saveAssignments = async () => {
    if (!assignManagerId) return;
    try {
      await data.setVillaAssignments(assignManagerId, selectedVillas);
      setAssignMsg(t("settings.villaAccessSaved"));
    } catch (e) {
      setAssignMsg(e instanceof Error ? e.message : t("settings.saveError"));
    }
  };

  const roleKey = `roles.${profile.role}` as MessageKey;
  const plan = resolvePlanTier({
    role: profile.role,
    orgKind: data.orgKind,
    organization: data.organization,
  });
  const showReports = canUseManagerReporting({
    role: profile.role,
    orgKind: data.orgKind,
    organization: data.organization,
  });

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-muted">{t("brand.tagline")}</p>
      </div>

      <Card id="language" className="scroll-mt-4 space-y-3 p-5">
        <LanguageSwitcher />
      </Card>

      <Card className="space-y-3 p-5">
        <Info label={t("common.name")} value={profile.full_name} />
        <Info label={t("common.email")} value={profile.email} />
        {isCompany ? (
          <Info label={t("common.role")} value={t(roleKey)} />
        ) : null}
        <Info
          label={isPersonal ? t("settings.workspace") : t("settings.organization")}
          value={data.orgName}
        />
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {t("plan.title")}
            </h2>
            <p className="mt-1 text-sm text-muted">{t(plan.noteKey)}</p>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
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
        </div>
        <a
          href="https://pulseflow.site/subscription"
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-sm font-semibold text-primary"
        >
          {t("plan.seePlans")}
        </a>
      </Card>

      {isCompany ? (
        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {t("settings.reputation")}
            </h2>
            <p className="text-sm text-muted">
              {profile.role === "owner"
                ? t("settings.reputationOwner")
                : t("settings.reputationStaff")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/endorsements">
              <Button size="sm" variant="secondary">
                <Star className="size-4" />
                {t("nav.endorsements")}
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="sm" variant="ghost">
                <Trophy className="size-4" />
                {t("nav.leaderboard")}
              </Button>
            </Link>
            <Link href="/messages">
              <Button size="sm" variant="ghost">
                {t("nav.chat")}
              </Button>
            </Link>
            {profile.role === "owner" || profile.role === "manager" ? (
              <Link href="/contacts">
                <Button size="sm" variant="ghost">
                  {t("nav.contacts")}
                </Button>
              </Link>
            ) : null}
          </div>
          {profile.role !== "owner" ? (
            <div className="rounded-2xl bg-[#F7F5F1] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("settings.publicLink")}
              </p>
              {publicShareSlug ? (
                <>
                  <p className="mt-1 break-all text-sm font-semibold text-ink">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/u/${publicShareSlug}`
                      : `/u/${publicShareSlug}`}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      variant="secondary"
                      onClick={async () => {
                        const url = `${window.location.origin}/u/${publicShareSlug}`;
                        await navigator.clipboard.writeText(url);
                        setCopiedShare(true);
                        setTimeout(() => setCopiedShare(false), 1500);
                      }}
                    >
                      <Copy className="size-4" />
                      {copiedShare ? t("common.copied") : t("settings.copyShare")}
                    </Button>
                    <Link
                      href={`/u/${publicShareSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1"
                    >
                      <Button size="sm" variant="ghost" className="w-full">
                        {t("common.open")}
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted">
                  {t("settings.preparingShareLink")}
                </p>
              )}
            </div>
          ) : null}
        </Card>
      ) : null}

      <BillingSettingsCard />

      {showInvitePanel ? (
        <Card className="space-y-4 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("plan.referralTitle")}
            </p>
            <p className="mt-1 text-sm text-muted">{t("plan.referralHint")}</p>
            {referralProgress ? (
              <div className="mt-3 rounded-2xl bg-[#F7F5F1] px-3 py-2.5">
                <p className="text-sm font-semibold text-ink">
                  {t("plan.referralProgress", {
                    count: referralProgress.count,
                    goal: referralProgress.goal,
                  })}
                </p>
                {referralProgress.claimed && referralProgress.bonusEndsAt ? (
                  <p className="mt-1 text-xs text-secondary">
                    {t("plan.referralUnlocked", {
                      date: formatShortDate(referralProgress.bonusEndsAt),
                    })}
                  </p>
                ) : referralProgress.count < referralProgress.goal ? (
                  <p className="mt-1 text-xs text-muted">
                    {t("plan.referralRemaining", {
                      remaining: referralProgress.goal - referralProgress.count,
                    })}
                  </p>
                ) : null}
              </div>
            ) : null}
            <p className="mt-3 text-xs font-semibold text-secondary">
              {t("settings.inviteCountsTowardReferral")}
            </p>
          </div>

          <InviteFlipCards
            referralCode={referralCode}
            invites={data.invites}
            isOwner={profile.role === "owner"}
          />
        </Card>
      ) : null}

      {canManageVillaAssignments(profile.role, data.orgKind) ? (
        <Card className="space-y-3 p-5">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {t("settings.villaAccess")}
            </h2>
            <p className="mt-1 text-sm text-muted" dir="auto">
              {t("settings.villaAccessHint")}
            </p>
          </div>
          <div>
            <Label>{t("settings.teamMember")}</Label>
            <Select
              value={assignManagerId}
              onChange={(e) => loadAssignments(e.target.value)}
            >
              <option value="">{t("settings.selectPerson")}</option>
              {assignablePeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} · {t(`roles.${p.role}` as MessageKey)}
                </option>
              ))}
            </Select>
          </div>
          {assignManagerId ? (
            <ul className="max-h-56 space-y-2 overflow-y-auto">
              {data.allOrgVillas.map((villa) => {
                const checked = selectedVillas.includes(villa.id);
                return (
                  <li key={villa.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#F7F5F1] px-3 py-2.5 text-sm">
                      <input
                        type="checkbox"
                        className="size-5 shrink-0 accent-primary"
                        checked={checked}
                        onChange={() => {
                          setSelectedVillas((prev) =>
                            checked
                              ? prev.filter((id) => id !== villa.id)
                              : [...prev, villa.id],
                          );
                        }}
                      />
                      <span className="font-semibold text-ink">{villa.name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {assignMsg ? (
            <p className="text-sm font-semibold text-secondary">{assignMsg}</p>
          ) : null}
          <Button
            variant="secondary"
            className="w-full"
            disabled={!assignManagerId}
            onClick={() => void saveAssignments()}
          >
            {t("settings.saveVillaAccess")}
          </Button>
        </Card>
      ) : null}

      {isCompany ? (
        <Card className="space-y-2 p-5">
          <h2 className="font-display text-lg font-bold text-ink">
            {t("settings.team")}
          </h2>
          {data.profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-2xl bg-[#F7F5F1] px-3 py-2.5 text-sm"
            >
              <span className="font-semibold text-ink">{p.full_name}</span>
              <span className="text-muted">
                {t(`roles.${p.role}` as MessageKey)}
              </span>
            </div>
          ))}
        </Card>
      ) : null}

      {showReports ? (
        <Card className="space-y-2 p-5">
          <h2 className="font-display text-lg font-bold text-ink">
            {t("settings.reportsLink")}
          </h2>
          <p className="text-sm text-muted">{t("settings.reportsHint")}</p>
          <Link
            href="/reports"
            className="inline-flex text-sm font-semibold text-primary"
          >
            {t("settings.reportsLink")} →
          </Link>
        </Card>
      ) : null}

      <Card className="space-y-2 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("settings.website")}
        </h2>
        <p className="text-sm text-muted">{t("settings.websiteHint")}</p>
        <a
          href="https://pulseflow.site"
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-sm font-semibold text-primary"
        >
          pulseflow.site
        </a>
      </Card>

      <Card className="space-y-2 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("settings.supportLink")}
        </h2>
        <p className="text-sm text-muted">{t("settings.supportHint")}</p>
        <a
          href={`mailto:${brand.supportEmail}`}
          className="inline-flex text-sm font-semibold text-primary"
        >
          {brand.supportEmail}
        </a>
      </Card>

      <PasskeySettingsCard />

      <PushSettingsCard />

      <JobSearchSettingsCard />

      <Button variant="danger" className="w-full" onClick={() => void signOut()}>
        {t("settings.signOut")}
      </Button>
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
