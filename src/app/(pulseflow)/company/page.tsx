"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useData } from "@/lib/data/use-app-data";
import {
  canInviteOwner,
  canManageVillaAssignments,
  companyHasOwner,
} from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

/** Villa access and team roster for company owners and managers. */
export default function CompanyPage() {
  const data = useData();
  const router = useRouter();
  const { t } = useI18n();
  const [assignManagerId, setAssignManagerId] = useState("");
  const [selectedVillas, setSelectedVillas] = useState<string[]>([]);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Profile | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [teamMsg, setTeamMsg] = useState<string | null>(null);

  const profile = data.profile;
  const isCompany = data.orgKind === "company";
  const showVillaAccess =
    !!profile && canManageVillaAssignments(profile.role, data.orgKind);
  const canRemoveMembers =
    !!profile &&
    isCompany &&
    (profile.role === "owner" || profile.role === "manager");
  const hasOwner = companyHasOwner(data.profiles);
  const needsOwner =
    !!profile &&
    isCompany &&
    !hasOwner &&
    canInviteOwner(profile.role, data.orgKind, hasOwner);

  const assignablePeople = useMemo(
    () =>
      data.profiles.filter(
        (p) =>
          (p.role === "cleaner" || p.role === "staff") &&
          p.id !== profile?.id,
      ),
    [data.profiles, profile?.id],
  );

  const team = useMemo(
    () => data.profiles.filter((p) => p.role !== "guest"),
    [data.profiles],
  );

  useEffect(() => {
    if (!data.ready || !profile) return;
    if (
      !isCompany ||
      (profile.role !== "owner" && profile.role !== "manager")
    ) {
      router.replace("/home");
    }
  }, [data.ready, profile, isCompany, router]);

  if (!data.ready || !profile) return <LoadingState />;
  if (!isCompany) return <LoadingState />;

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

  const canRemove = (p: Profile) => {
    if (!canRemoveMembers || p.id === profile.id) return false;
    if (p.role === "owner") return false;
    if (profile.role === "manager" && p.role === "manager") return false;
    return true;
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setRemoveBusy(true);
    setTeamMsg(null);
    try {
      const res = await fetch("/api/org/remove-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: removeTarget.id,
          orgId: profile.org_id,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? t("settings.removeMemberError"));
      }
      setRemoveTarget(null);
      setTeamMsg(t("settings.removeMemberDone"));
      await data.refresh();
    } catch (e) {
      setTeamMsg(
        e instanceof Error ? e.message : t("settings.removeMemberError"),
      );
    } finally {
      setRemoveBusy(false);
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

      {needsOwner ? (
        <Card className="space-y-2 border-primary/30 bg-primary/5 p-4">
          <p className="font-display text-base font-bold text-ink">
            {t("invite.needsOwnerTitle")}
          </p>
          <p className="text-sm text-muted">{t("invite.needsOwnerHint")}</p>
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => router.push("/invites")}
          >
            {t("invite.goInviteOwner")}
          </Button>
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
                    <label className="pf-panel-soft flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-primary"
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

      <Card id="team" className="scroll-mt-4 space-y-3 p-5">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            {t("settings.team")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("settings.teamHint")}</p>
        </div>
        {team.map((p) => (
          <div
            key={p.id}
            className="pf-panel-soft flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm"
          >
            <div className="min-w-0">
              <span className="font-semibold text-ink">{p.full_name}</span>
              <span className="ms-2 text-muted">
                {t(`roles.${p.role}` as MessageKey)}
              </span>
            </div>
            {canRemove(p) ? (
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 text-danger"
                onClick={() => {
                  setTeamMsg(null);
                  setRemoveTarget(p);
                }}
              >
                {t("settings.removeMember")}
              </Button>
            ) : null}
          </div>
        ))}
        {teamMsg ? (
          <p
            className={`text-sm font-semibold ${
              teamMsg === t("settings.removeMemberDone")
                ? "text-secondary"
                : "text-danger"
            }`}
          >
            {teamMsg}
          </p>
        ) : null}
      </Card>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title={t("settings.removeMemberTitle")}
        description={
          removeTarget
            ? t("settings.removeMemberHint", { name: removeTarget.full_name })
            : undefined
        }
        confirmLabel={t("settings.removeMemberConfirm")}
        busy={removeBusy}
        onConfirm={() => void confirmRemove()}
        onClose={() => {
          if (!removeBusy) setRemoveTarget(null);
        }}
      />
    </div>
  );
}
