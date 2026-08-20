"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, NotebookPen, QrCode, Star, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { isDemoMode, createClient } from "@/lib/supabase/client";
import { demoLogout } from "@/lib/demo/store";
import type { UserRole } from "@/lib/design-tokens";
import {
  canInvite,
  canManageVillaAssignments,
  invitableRoles,
} from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { BillingSettingsCard } from "@/components/billing/billing-card";
import type { MessageKey } from "@/lib/i18n";
import {
  referralRegisterUrl,
  resolvePlanTier,
} from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const data = useData();
  const router = useRouter();
  const { t } = useI18n();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteRole, setInviteRole] =
    useState<Exclude<UserRole, "owner">>("manager");
  const [inviteTitle, setInviteTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [assignManagerId, setAssignManagerId] = useState("");
  const [selectedVillas, setSelectedVillas] = useState<string[]>([]);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copiedReferral, setCopiedReferral] = useState(false);

  const roleOptions = useMemo(
    () =>
      data.profile
        ? invitableRoles(data.profile.role, data.orgKind)
        : [],
    [data.profile, data.orgKind],
  );

  const isCompany = data.orgKind === "company";
  const isPersonal = data.orgKind === "personal";

  const effectiveInviteRole = (
    roleOptions.includes(inviteRole) ? inviteRole : roleOptions[0] ?? "cleaner"
  ) as Exclude<UserRole, "owner">;

  const assignablePeople = useMemo(
    () =>
      data.profiles.filter(
        (p) => p.role !== "owner" && p.id !== data.profile?.id,
      ),
    [data.profiles, data.profile?.id],
  );

  if (!data.ready || !data.profile) return <LoadingState />;
  const profile = data.profile;

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

  const createInvite = async () => {
    setInviteError(null);
    setCreating(true);
    try {
      const invite = await data.createInvite({
        role: effectiveInviteRole,
        jobTitle: inviteTitle || undefined,
      });
      const link = `${window.location.origin}/join/${invite.token}`;
      await navigator.clipboard.writeText(link);
      setCopiedToken(invite.token);
      setInviteTitle("");
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : t("settings.inviteError"));
    } finally {
      setCreating(false);
    }
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
  const referralCode = profile.share_slug?.trim() || profile.id.slice(0, 8);

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
                : plan.tier === "basic"
                  ? "bg-secondary-soft text-secondary-dark"
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
        {(profile.role === "owner" || profile.role === "manager") &&
        isCompany ? (
          <div className="rounded-2xl bg-[#F7F5F1] px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("plan.referralTitle")}
            </p>
            <p className="mt-1 text-sm text-muted">{t("plan.referralHint")}</p>
            <Button
              size="sm"
              className="mt-3 w-full"
              variant="secondary"
              onClick={async () => {
                const url = referralRegisterUrl(
                  window.location.origin,
                  referralCode,
                );
                await navigator.clipboard.writeText(url);
                setCopiedReferral(true);
                setTimeout(() => setCopiedReferral(false), 1500);
              }}
            >
              <Copy className="size-4" />
              {copiedReferral ? t("plan.referralCopied") : t("plan.copyReferral")}
            </Button>
          </div>
        ) : null}
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
          </div>
          {profile.role !== "owner" ? (
            <div className="rounded-2xl bg-[#F7F5F1] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("settings.publicLink")}
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-ink">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/u/${profile.share_slug}`
                  : `/u/${profile.share_slug}`}
              </p>
              <Button
                size="sm"
                className="mt-3 w-full"
                variant="secondary"
                onClick={async () => {
                  const url = `${window.location.origin}/u/${profile.share_slug}`;
                  await navigator.clipboard.writeText(url);
                  setCopiedShare(true);
                  setTimeout(() => setCopiedShare(false), 1500);
                }}
              >
                <Copy className="size-4" />
                {copiedShare ? t("common.copied") : t("settings.copyShare")}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      <BillingSettingsCard />

      {canInvite(profile.role, data.orgKind) ? (
        <Card className="space-y-3 p-5">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              {t("settings.invite")}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t("settings.inviteHint")}
            </p>
          </div>

          <div>
            <Label>{t("common.role")}</Label>
            <Select
              value={effectiveInviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as Exclude<UserRole, "owner">)
              }
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}` as MessageKey)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{t("settings.jobTitle")}</Label>
            <Input
              value={inviteTitle}
              onChange={(e) => setInviteTitle(e.target.value)}
              placeholder={t("settings.jobTitlePlaceholder")}
            />
          </div>
          {inviteError ? (
            <p className="text-sm text-danger">{inviteError}</p>
          ) : null}
          {copiedToken ? (
            <p className="text-sm font-semibold text-secondary">
              {t("settings.inviteCopied")}
            </p>
          ) : null}
          <Button
            className="w-full"
            disabled={creating || roleOptions.length === 0}
            onClick={() => void createInvite()}
          >
            {creating ? t("settings.creating") : t("settings.createInvite")}
          </Button>

          {data.invites.length > 0 ? (
            <div className="space-y-2 border-t border-black/5 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("settings.openInvites")}
              </p>
              {data.invites.map((inv) => (
                <div key={inv.id}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-semibold text-ink">
                        {t(`roles.${inv.role}` as MessageKey)}
                        {inv.job_title ? ` · ${inv.job_title}` : ""}
                      </p>
                      <p className="text-xs text-muted">
                        {t("settings.waitingToJoin")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const link = `${window.location.origin}/join/${inv.token}`;
                          await navigator.clipboard.writeText(link);
                          setCopiedToken(inv.token);
                        }}
                      >
                        {t("common.copy")}
                      </Button>
                      {profile.role === "owner" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (qrToken === inv.token) {
                              setQrToken(null);
                              setQrUrl(null);
                              return;
                            }
                            const url = `${window.location.origin}/join/${inv.token}`;
                            setQrToken(inv.token);
                            setQrUrl(url);
                          }}
                        >
                          <QrCode className="size-4" />
                          QR
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {qrToken === inv.token && qrUrl ? (
                    <Card className="mt-3 space-y-2 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Scan to join
                      </p>
                      <img
                        alt="Invite QR code"
                        className="mx-auto rounded-2xl border border-black/5"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                          qrUrl,
                        )}`}
                        width={260}
                        height={260}
                        loading="lazy"
                      />
                    </Card>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
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
