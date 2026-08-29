"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";

export function HouseGuideEditor({ villaId }: { villaId: string }) {
  const data = useData();
  const { t } = useI18n();
  const role = data.profile?.role;
  const canEdit = role === "owner" || role === "manager";
  const existing = data.houseGuides.find((g) => g.villa_id === villaId);

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
    setWifiSsid(existing?.wifi_ssid ?? "");
    setWifiPassword(existing?.wifi_password ?? "");
    setGateCode(existing?.gate_code ?? "");
    setBins(existing?.bins_notes ?? "");
    setQuiet(existing?.quiet_hours ?? "");
    setCheckout(existing?.checkout_checklist ?? "");
    setExtra(existing?.extra_notes ?? "");
  }, [existing]);

  if (!canEdit) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await data.upsertHouseGuide(villaId, {
        wifi_ssid: wifiSsid.trim() || null,
        wifi_password: wifiPassword.trim() || null,
        gate_code: gateCode.trim() || null,
        bins_notes: bins.trim() || null,
        quiet_hours: quiet.trim() || null,
        checkout_checklist: checkout.trim() || null,
        extra_notes: extra.trim() || null,
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-4 space-y-3 p-4">
      <p className="font-display text-base font-bold text-ink">
        {t("guest.guideEditTitle")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="guide-wifi">{t("guest.wifi")}</Label>
          <Input
            id="guide-wifi"
            value={wifiSsid}
            onChange={(e) => setWifiSsid(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="guide-pass">{t("guest.password")}</Label>
          <Input
            id="guide-pass"
            value={wifiPassword}
            onChange={(e) => setWifiPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="guide-gate">{t("guest.gate")}</Label>
          <Input
            id="guide-gate"
            value={gateCode}
            onChange={(e) => setGateCode(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="guide-quiet">{t("guest.quietHours")}</Label>
          <Input
            id="guide-quiet"
            value={quiet}
            onChange={(e) => setQuiet(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="guide-bins">{t("guest.bins")}</Label>
        <Input
          id="guide-bins"
          value={bins}
          onChange={(e) => setBins(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="guide-checkout">{t("guest.checkout")}</Label>
        <Textarea
          id="guide-checkout"
          rows={4}
          value={checkout}
          onChange={(e) => setCheckout(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="guide-extra">{t("common.notes")}</Label>
        <Textarea
          id="guide-extra"
          rows={3}
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {saved ? (
        <p className="text-sm font-semibold text-secondary">{t("common.saved")}</p>
      ) : null}
      <Button type="button" disabled={saving} onClick={() => void save()}>
        {saving ? `${t("guest.guideSave")}…` : t("guest.guideSave")}
      </Button>
    </Card>
  );
}
