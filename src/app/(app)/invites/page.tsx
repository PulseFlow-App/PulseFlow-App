"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { canInviteAnyone } from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import { InviteFlipCards } from "@/components/settings/invite-flip-cards";
import type { ReferralProgress } from "@/lib/billing/referrals";
import { formatShortDate } from "@/lib/utils";

export default function InvitesPage() {
  const data = useData();
  const router = useRouter();
  const { t } = useI18n();
  const [referralProgress, setReferralProgress] =
    useState<ReferralProgress | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const profile = data.profile;
  const showInvitePanel = !!profile && canInviteAnyone(profile.role);

  useEffect(() => {
    if (!data.ready || !profile) return;
    if (!showInvitePanel) router.replace("/home");
  }, [data.ready, profile, showInvitePanel, router]);

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
  if (!showInvitePanel) return <LoadingState />;

  const publicShareSlug = profile.share_slug?.trim() ?? null;
  const referralCode = profile.share_slug?.trim() || profile.id.slice(0, 8);

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("nav.invites")}
        </h1>
        <p className="text-sm text-muted">{t("settings.inviteHint")}</p>
      </div>

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
    </div>
  );
}
