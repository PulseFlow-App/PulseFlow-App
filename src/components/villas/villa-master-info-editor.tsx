"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";

export type MasterInfoDraft = {
  utilities_notes: string;
  service_providers_notes: string;
  access_notes: string;
  key_contacts_notes: string;
  tax_notes: string;
  handoff_notes: string;
  allow_manager_view: boolean;
};

export const EMPTY_MASTER_INFO_DRAFT: MasterInfoDraft = {
  utilities_notes: "",
  service_providers_notes: "",
  access_notes: "",
  key_contacts_notes: "",
  tax_notes: "",
  handoff_notes: "",
  allow_manager_view: true,
};

export function masterInfoPayload(draft: MasterInfoDraft, isOwner: boolean) {
  return {
    utilities_notes: draft.utilities_notes.trim() || null,
    service_providers_notes: draft.service_providers_notes.trim() || null,
    access_notes: draft.access_notes.trim() || null,
    key_contacts_notes: draft.key_contacts_notes.trim() || null,
    tax_notes: draft.tax_notes.trim() || null,
    handoff_notes: draft.handoff_notes.trim() || null,
    ...(isOwner ? { allow_manager_view: draft.allow_manager_view } : {}),
  };
}

export function masterInfoHasContent(draft: MasterInfoDraft) {
  return [
    draft.utilities_notes,
    draft.service_providers_notes,
    draft.access_notes,
    draft.key_contacts_notes,
    draft.tax_notes,
    draft.handoff_notes,
  ].some((v) => v.trim());
}

type Props =
  | { villaId: string; value?: undefined; onChange?: undefined; embed?: boolean }
  | {
      villaId?: undefined;
      value: MasterInfoDraft;
      onChange: (next: MasterInfoDraft) => void;
      embed?: boolean;
    };

export function VillaMasterInfoEditor(props: Props) {
  const data = useData();
  const { t } = useI18n();
  const role = data.profile?.role;
  const isOwner = role === "owner";
  const canEdit = role === "owner" || role === "manager";
  const controlled = props.value != null && props.onChange != null;
  const existing = props.villaId
    ? data.villaMasterInfo.find((g) => g.villa_id === props.villaId)
    : undefined;

  const [utilities, setUtilities] = useState("");
  const [providers, setProviders] = useState("");
  const [access, setAccess] = useState("");
  const [contacts, setContacts] = useState("");
  const [tax, setTax] = useState("");
  const [handoff, setHandoff] = useState("");
  const [allowManager, setAllowManager] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (controlled) return;
    setUtilities(existing?.utilities_notes ?? "");
    setProviders(existing?.service_providers_notes ?? "");
    setAccess(existing?.access_notes ?? "");
    setContacts(existing?.key_contacts_notes ?? "");
    setTax(existing?.tax_notes ?? "");
    setHandoff(existing?.handoff_notes ?? "");
    setAllowManager(existing?.allow_manager_view !== false);
  }, [controlled, existing]);

  if (!canEdit && !existing && !controlled) return null;
  if (
    !controlled &&
    role === "manager" &&
    existing?.allow_manager_view === false
  ) {
    return null;
  }

  const draft: MasterInfoDraft = controlled
    ? props.value
    : {
        utilities_notes: utilities,
        service_providers_notes: providers,
        access_notes: access,
        key_contacts_notes: contacts,
        tax_notes: tax,
        handoff_notes: handoff,
        allow_manager_view: allowManager,
      };

  const setDraft = (patch: Partial<MasterInfoDraft>) => {
    const next = { ...draft, ...patch };
    if (controlled) {
      props.onChange(next);
      return;
    }
    if (patch.utilities_notes != null) setUtilities(patch.utilities_notes);
    if (patch.service_providers_notes != null) {
      setProviders(patch.service_providers_notes);
    }
    if (patch.access_notes != null) setAccess(patch.access_notes);
    if (patch.key_contacts_notes != null) setContacts(patch.key_contacts_notes);
    if (patch.tax_notes != null) setTax(patch.tax_notes);
    if (patch.handoff_notes != null) setHandoff(patch.handoff_notes);
    if (patch.allow_manager_view != null) {
      setAllowManager(patch.allow_manager_view);
    }
  };

  const save = async () => {
    if (!props.villaId || !canEdit) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await data.upsertVillaMasterInfo(
        props.villaId,
        masterInfoPayload(draft, isOwner),
      );
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const field = (
    id: string,
    label: string,
    key: keyof MasterInfoDraft,
  ) => (
    <div className="min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={2}
        value={String(draft[key] ?? "")}
        onChange={(e) => setDraft({ [key]: e.target.value })}
        disabled={!canEdit && !controlled}
      />
    </div>
  );

  const body = (
    <div className="space-y-3">
      {!props.embed ? (
        <div>
          <p className="font-display text-base font-bold text-ink">
            {t("villas.masterInfoTitle")}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-muted">
            {t("villas.masterInfoHint")}
          </p>
        </div>
      ) : null}

      {field("master-utils", t("villas.masterUtilities"), "utilities_notes")}
      {field(
        "master-providers",
        t("villas.masterProviders"),
        "service_providers_notes",
      )}
      {field("master-access", t("villas.masterAccess"), "access_notes")}
      {field(
        "master-contacts",
        t("villas.masterContacts"),
        "key_contacts_notes",
      )}
      {field("master-tax", t("villas.masterTax"), "tax_notes")}
      {field("master-handoff", t("villas.masterHandoff"), "handoff_notes")}

      {isOwner || controlled ? (
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-canvas-deep px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            className="size-5 shrink-0 accent-primary"
            checked={draft.allow_manager_view}
            onChange={(e) =>
              setDraft({ allow_manager_view: e.target.checked })
            }
          />
          <span className="font-semibold text-ink">
            {t("villas.masterAllowManager")}
          </span>
        </label>
      ) : null}

      {error ? (
        <p className="text-sm font-semibold text-danger">{error}</p>
      ) : null}
      {saved ? (
        <p className="text-sm font-semibold text-secondary">{t("common.saved")}</p>
      ) : null}
      {props.villaId && !props.embed && canEdit ? (
        <Button size="sm" onClick={() => void save()} busy={saving}>
          {t("common.save")}
        </Button>
      ) : null}
    </div>
  );

  if (props.embed) return body;
  return <Card className="space-y-3 p-4">{body}</Card>;
}
