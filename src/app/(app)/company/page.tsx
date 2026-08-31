"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/empty-state";
import { useData } from "@/lib/data/use-app-data";
import { canManageVillaAssignments } from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";

/** Villa access and team roster for company owners and managers. */
export default function CompanyPage() {
  const data = useData();
  const router = useRouter();
  const { t } = useI18n();
  const [assignManagerId, setAssignManagerId] = useState("");
  const [selectedVillas, setSelectedVillas] = useState<string[]>([]);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  const profile = data.profile;
  const isCompany = data.orgKind === "company";
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

  return (
    <div className="space-y-4 animate-rise">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {t("nav.company")}
        </h1>
        <p className="text-sm text-muted">{data.orgName}</p>
      </div>

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
