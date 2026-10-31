"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/lib/i18n";
import type { Organization, OrgMembership } from "@/lib/types";
import type { UserRole } from "@/lib/design-tokens";

type WorkspaceRow = {
  orgId: string;
  name: string;
  kind: "personal" | "company";
  role: UserRole;
  active: boolean;
};

function buildWorkspaces(input: {
  profileId: string;
  activeOrgId: string;
  personalOrgId: string | null;
  orgs: Organization[];
  memberships: OrgMembership[];
  activeRole: UserRole;
}): WorkspaceRow[] {
  const byId = new Map(input.orgs.map((o) => [o.id, o]));
  const rows: WorkspaceRow[] = [];
  const seen = new Set<string>();

  const push = (
    orgId: string,
    role: UserRole,
    forceKind?: "personal" | "company",
  ) => {
    if (seen.has(orgId)) return;
    const org = byId.get(orgId);
    if (!org) return;
    const kind =
      forceKind ??
      (org.kind === "personal" ? "personal" : "company");
    if (kind === "personal" && input.personalOrgId && orgId !== input.personalOrgId) {
      return;
    }
    seen.add(orgId);
    rows.push({
      orgId,
      name: org.name,
      kind,
      role,
      active: orgId === input.activeOrgId,
    });
  };

  if (input.personalOrgId) {
    push(input.personalOrgId, "owner", "personal");
  }

  for (const m of input.memberships) {
    if (m.profile_id !== input.profileId) continue;
    push(m.org_id, m.role);
  }

  // Active org even if membership row is missing (legacy).
  push(input.activeOrgId, input.activeRole);

  return rows.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "personal" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function WorkspaceSwitcherCard() {
  const data = useData();
  const { t } = useI18n();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!data.profile) return [];
    return buildWorkspaces({
      profileId: data.profile.id,
      activeOrgId: data.profile.org_id,
      personalOrgId: data.profile.personal_org_id,
      orgs: data.orgs,
      memberships: data.memberships,
      activeRole: data.profile.role,
    });
  }, [data.profile, data.orgs, data.memberships]);

  if (!data.profile || data.profile.role === "guest") return null;
  if (rows.length < 2) return null;

  const switchTo = async (orgId: string) => {
    if (orgId === data.profile?.org_id) return;
    setBusyId(orgId);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/org/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? t("settings.workspaceSwitchError"));
      }
      setMsg(t("settings.workspaceSwitched"));
      await data.refresh();
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : t("settings.workspaceSwitchError"),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="space-y-3 p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-ink">
          {t("settings.yourCompanies")}
        </h2>
        <p className="mt-1 text-sm text-ink/70">{t("settings.yourCompaniesHint")}</p>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => {
          const roleKey = `roles.${row.role}` as MessageKey;
          return (
            <li key={row.orgId}>
              <button
                type="button"
                disabled={Boolean(busyId) || row.active}
                onClick={() => void switchTo(row.orgId)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border px-3 py-3 text-start transition",
                  row.active
                    ? "border-secondary bg-secondary-soft/40"
                    : "border-[var(--color-border)] bg-surface hover:border-secondary/50",
                  busyId && !row.active ? "opacity-60" : null,
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">
                    {row.kind === "personal"
                      ? t("settings.myPersonal")
                      : row.name}
                  </span>
                  <span className="type-meta">
                    {row.kind === "personal"
                      ? t("villas.personal")
                      : `${t("villas.company")} · ${t(roleKey)}`}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-secondary">
                  {row.active
                    ? t("settings.workspaceActive")
                    : busyId === row.orgId
                      ? t("common.saving")
                      : t("settings.workspaceSwitch")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {msg ? (
        <p className="text-sm font-semibold text-secondary">{msg}</p>
      ) : null}
      {err ? <p className="text-sm font-semibold text-danger">{err}</p> : null}
    </Card>
  );
}
