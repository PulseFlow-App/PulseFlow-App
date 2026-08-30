"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import {
  canInviteAnyone,
  canManageVillaAssignments,
} from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import { InviteFlipCards } from "@/components/settings/invite-flip-cards";
import type { MessageKey } from "@/lib/i18n";
import type { ReferralProgress } from "@/lib/billing/referrals";
import { formatShortDate } from "@/lib/utils";

/** Team ops that used to live in Settings - invites, villa access, roster. */
export default function CompanyPage() {
  const data = useData();
  const router = useRouter();
  const { t } = useI18n();
  const [assignManagerId, setAssignManagerId] = useState("");
  const [selectedVillas, setSelectedVillas] = useState<string[]>([]);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const [referralProgress, setReferralProgress] =
    useState<ReferralProgress | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const profile = data.profile;
  const isCompany = data.orgKind === "company";
  const showInvitePanel = !!profile && canInviteAnyone(profile.role);
  const showVillaAccess =
    !!profile && canManageVillaAssignments(profile.role, data.orgKind);

  const assignablePeople = useMemo(
    () =>
      data.profiles.filter(
        (p) =>
          (p.role === "cleaner" || p.role === "staff") &&
          p.id !== profile?.id,
      ),
    [data.profiles, profile?.id],
  );

  useEffect(() => {
    if (!data.ready || !profile) return;
    if (
      !isCompany ||
      (!showInvitePanel && !showVillaAccess && profile.role !== "owner" && profile.role !== "manager")
    ) {
      router.replace("/home");
    }
  }, [
    data.ready,
    profile,
    isCompany,
    showInvitePanel,
    showVillaAccess,
    router,
  ]);

  useEffect(() => {
    if (!showInvitePanel) return;
    void fetch("/api/referrals/progress")
      .then((r) => r.json())
      .then((payload) => setReferralProgress(payload as ReferralProgress))
      .catch(() => setReferralProgress(null));
  }, [showInvitePanel]);

  useEffect(() => {
    if (!data.ready || !profile) return;
    if (profile.role === "owner") return;
    if (profile.share_slug?.trim()) return;
    void fetch("/api/profile/share-slug", { method: "POST" })
      .then((r) => r.json())
      .then((payload: { share_slug?: string | null }) => {
        if (payload.share_slug) void data.refresh();
      })
      .catch(() => undefined);
  }, [
    data.ready,
    profile?.id,
    profile?.role,
    profile?.share_slug,
    data.refresh,
  ]);

  if (!data.ready || !profile) return <LoadingState />;
  if (!isCompany) return <LoadingState />;

  const publicShareSlug = profile.share_slug?.trim() ?? null;
  const referralCode = profile.share_slug?.trim() || profile.id.slice(0, 8);

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

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("nav.company")}
        </h1>
        <p className="text-sm text-muted">{data.orgName}</p>
      </div>

      {showInvitePanel ? (
        <Card id="invites" className="scroll-mt-4 space-y-4 p-5">
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

          {profile.role !== "owner" && publicShareSlug ? (
            <div className="rounded-2xl bg-[#F7F5F1] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("settings.publicLink")}
              </p>
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
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      {showVillaAccess ? (
        <Card id="villa-access" className="scroll-mt-4 space-y-3 p-5">
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

      <Card id="team" className="scroll-mt-4 space-y-2 p-5">
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
    </div>
  );
}
