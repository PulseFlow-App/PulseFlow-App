"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";

export function VillaMasterInfoEditor({ villaId }: { villaId: string }) {
  const data = useData();
  const { t } = useI18n();
  const role = data.profile?.role;
  const canEdit = role === "owner" || role === "manager";
  const existing = data.villaMasterInfo.find((g) => g.villa_id === villaId);

  const [utilities, setUtilities] = useState("");
  const [providers, setProviders] = useState("");
  const [access, setAccess] = useState("");
  const [contacts, setContacts] = useState("");
  const [tax, setTax] = useState("");
  const [handoff, setHandoff] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUtilities(existing?.utilities_notes ?? "");
    setProviders(existing?.service_providers_notes ?? "");
    setAccess(existing?.access_notes ?? "");
    setContacts(existing?.key_contacts_notes ?? "");
    setTax(existing?.tax_notes ?? "");
    setHandoff(existing?.handoff_notes ?? "");
  }, [existing]);

  if (!canEdit && !existing) return null;

  const save = async () => {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await data.upsertVillaMasterInfo(villaId, {
        utilities_notes: utilities.trim() || null,
        service_providers_notes: providers.trim() || null,
        access_notes: access.trim() || null,
        key_contacts_notes: contacts.trim() || null,
        tax_notes: tax.trim() || null,
        handoff_notes: handoff.trim() || null,
      });
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
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
  ) => (
    <div className="min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={!canEdit}
        className="text-sm"
      />
    </div>
  );

  return (
    <Card className="mt-4 space-y-3 p-4">
      <div>
        <p className="font-display text-base font-bold text-ink">
          {t("villas.masterInfoTitle")}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted">
          {t("villas.masterInfoHint")}
        </p>
      </div>

      {field(
        "master-utils",
        t("villas.masterUtilities"),
        utilities,
        setUtilities,
        t("villas.masterUtilitiesPh"),
      )}
      {field(
        "master-providers",
        t("villas.masterProviders"),
        providers,
        setProviders,
        t("villas.masterProvidersPh"),
      )}
      {field(
        "master-access",
        t("villas.masterAccess"),
        access,
        setAccess,
        t("villas.masterAccessPh"),
      )}
      {field(
        "master-contacts",
        t("villas.masterContacts"),
        contacts,
        setContacts,
        t("villas.masterContactsPh"),
      )}
      {field(
        "master-tax",
        t("villas.masterTax"),
        tax,
        setTax,
        t("villas.masterTaxPh"),
      )}
      {field(
        "master-handoff",
        t("villas.masterHandoff"),
        handoff,
        setHandoff,
        t("villas.masterHandoffPh"),
      )}

      {error ? (
        <p className="text-sm font-semibold text-danger">{error}</p>
      ) : null}
      {saved ? (
        <p className="text-sm font-semibold text-secondary">{t("common.saved")}</p>
      ) : null}
      {canEdit ? (
        <Button size="sm" onClick={() => void save()} busy={saving}>
          {t("common.save")}
        </Button>
      ) : null}
    </Card>
  );
}
