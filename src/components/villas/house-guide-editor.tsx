"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";

export type HouseGuideDraft = {
  wifi_ssid: string;
  wifi_password: string;
  gate_code: string;
  bins_notes: string;
  quiet_hours: string;
  checkout_checklist: string;
  extra_notes: string;
};

export const EMPTY_HOUSE_GUIDE_DRAFT: HouseGuideDraft = {
  wifi_ssid: "",
  wifi_password: "",
  gate_code: "",
  bins_notes: "",
  quiet_hours: "",
  checkout_checklist: "",
  extra_notes: "",
};

export function houseGuidePayload(draft: HouseGuideDraft) {
  return {
    wifi_ssid: draft.wifi_ssid.trim() || null,
    wifi_password: draft.wifi_password.trim() || null,
    gate_code: draft.gate_code.trim() || null,
    bins_notes: draft.bins_notes.trim() || null,
    quiet_hours: draft.quiet_hours.trim() || null,
    checkout_checklist: draft.checkout_checklist.trim() || null,
    extra_notes: draft.extra_notes.trim() || null,
  };
}

export function houseGuideHasContent(draft: HouseGuideDraft) {
  return Object.values(houseGuidePayload(draft)).some((v) => v != null);
}

type Props =
  | { villaId: string; value?: undefined; onChange?: undefined; embed?: boolean }
  | {
      villaId?: undefined;
      value: HouseGuideDraft;
      onChange: (next: HouseGuideDraft) => void;
      embed?: boolean;
    };

export function HouseGuideEditor(props: Props) {
  const data = useData();
  const { t } = useI18n();
  const role = data.profile?.role;
  const canEdit = role === "owner" || role === "manager";
  const controlled = props.value != null && props.onChange != null;
  const existing = props.villaId
    ? data.houseGuides.find((g) => g.villa_id === props.villaId)
    : undefined;

  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [bins, setBins] = useState("");
  const [quiet, setQuiet] = useState("");
  const [checkout, setCheckout] = useState("");
  const [extra, setExtra] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (controlled) return;
    setWifiSsid(existing?.wifi_ssid ?? "");
    setWifiPassword(existing?.wifi_password ?? "");
    setGateCode(existing?.gate_code ?? "");
    setBins(existing?.bins_notes ?? "");
    setQuiet(existing?.quiet_hours ?? "");
    setCheckout(existing?.checkout_checklist ?? "");
    setExtra(existing?.extra_notes ?? "");
  }, [controlled, existing]);

  if (!canEdit && !controlled) return null;

  const draft: HouseGuideDraft = controlled
    ? props.value
    : {
        wifi_ssid: wifiSsid,
        wifi_password: wifiPassword,
        gate_code: gateCode,
        bins_notes: bins,
        quiet_hours: quiet,
        checkout_checklist: checkout,
        extra_notes: extra,
      };

  const setDraft = (patch: Partial<HouseGuideDraft>) => {
    const next = { ...draft, ...patch };
    if (controlled) {
      props.onChange(next);
      return;
    }
    if (patch.wifi_ssid != null) setWifiSsid(patch.wifi_ssid);
    if (patch.wifi_password != null) setWifiPassword(patch.wifi_password);
    if (patch.gate_code != null) setGateCode(patch.gate_code);
    if (patch.bins_notes != null) setBins(patch.bins_notes);
    if (patch.quiet_hours != null) setQuiet(patch.quiet_hours);
    if (patch.checkout_checklist != null) setCheckout(patch.checkout_checklist);
    if (patch.extra_notes != null) setExtra(patch.extra_notes);
  };

  const save = async () => {
    if (!props.villaId || !canEdit) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await data.upsertHouseGuide(props.villaId, houseGuidePayload(draft));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const body = (
    <div className="space-y-3">
      {!props.embed ? (
        <p className="font-display text-base font-bold text-ink">
          {t("guest.guideEditTitle")}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="guide-wifi">{t("guest.wifi")}</Label>
          <Input
            id="guide-wifi"
            value={draft.wifi_ssid}
            onChange={(e) => setDraft({ wifi_ssid: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="guide-pass">{t("guest.password")}</Label>
          <Input
            id="guide-pass"
            value={draft.wifi_password}
            onChange={(e) => setDraft({ wifi_password: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="guide-gate">{t("guest.gate")}</Label>
          <Input
            id="guide-gate"
            value={draft.gate_code}
            onChange={(e) => setDraft({ gate_code: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="guide-quiet">{t("guest.quietHours")}</Label>
          <Input
            id="guide-quiet"
            value={draft.quiet_hours}
            onChange={(e) => setDraft({ quiet_hours: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="guide-bins">{t("guest.bins")}</Label>
        <Input
          id="guide-bins"
          value={draft.bins_notes}
          onChange={(e) => setDraft({ bins_notes: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="guide-checkout">{t("guest.checkout")}</Label>
        <Textarea
          id="guide-checkout"
          rows={4}
          value={draft.checkout_checklist}
          onChange={(e) => setDraft({ checkout_checklist: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="guide-extra">{t("common.notes")}</Label>
        <Textarea
          id="guide-extra"
          rows={3}
          value={draft.extra_notes}
          onChange={(e) => setDraft({ extra_notes: e.target.value })}
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {saved ? (
        <p className="text-sm font-semibold text-secondary">{t("common.saved")}</p>
      ) : null}
      {props.villaId && !props.embed ? (
        <Button type="button" busy={saving} onClick={() => void save()}>
          {saving ? `${t("guest.guideSave")}…` : t("guest.guideSave")}
        </Button>
      ) : null}
    </div>
  );

  if (props.embed) return body;
  return <Card className="mt-4 space-y-3 p-4">{body}</Card>;
}
