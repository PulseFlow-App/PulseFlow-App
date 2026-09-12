"use client";

import { Input, Label, Select } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import {
  VILLA_AIRCON,
  VILLA_KITCHENS,
  VILLA_PARKING,
  VILLA_SETTINGS,
  VILLA_VIEWS,
  type TriSelect,
  type VillaDetailsForm,
} from "@/lib/villas/property-details";

export function VillaDetailsFields({
  value,
  onChange,
}: {
  value: VillaDetailsForm;
  onChange: (next: VillaDetailsForm) => void;
}) {
  const { t } = useI18n();
  const set = <K extends keyof VillaDetailsForm>(
    key: K,
    next: VillaDetailsForm[K],
  ) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-ink">{t("villas.details")}</p>
        <p className="text-xs text-muted">{t("villas.detailsHint")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t("villas.sqm")}
          value={value.sq_m}
          onChange={(v) => set("sq_m", v)}
          step="1"
        />
        <NumberField
          label={t("villas.bedrooms")}
          value={value.bedrooms}
          onChange={(v) => set("bedrooms", v)}
          step="1"
        />
        <NumberField
          label={t("villas.bathrooms")}
          value={value.bathrooms}
          onChange={(v) => set("bathrooms", v)}
          step="0.5"
        />
        <NumberField
          label={t("villas.maxGuests")}
          value={value.max_guests}
          onChange={(v) => set("max_guests", v)}
          step="1"
        />
        <NumberField
          label={t("villas.floors")}
          value={value.floors}
          onChange={(v) => set("floors", v)}
          step="1"
        />
        <EnumField
          label={t("villas.setting")}
          value={value.setting}
          unsetLabel={t("villas.unset")}
          options={VILLA_SETTINGS.map((id) => ({
            id,
            label: t(`villas.setting.${id}` as MessageKey),
          }))}
          onChange={(v) => set("setting", v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TriField
          label={t("villas.pool")}
          value={value.has_pool}
          yes={t("villas.yes")}
          no={t("villas.no")}
          unset={t("villas.unset")}
          onChange={(v) => set("has_pool", v)}
        />
        <TriField
          label={t("villas.garden")}
          value={value.has_garden}
          yes={t("villas.yes")}
          no={t("villas.no")}
          unset={t("villas.unset")}
          onChange={(v) => set("has_garden", v)}
        />
        <EnumField
          label={t("villas.parking")}
          value={value.parking}
          unsetLabel={t("villas.unset")}
          options={VILLA_PARKING.map((id) => ({
            id,
            label: t(`villas.parking.${id}` as MessageKey),
          }))}
          onChange={(v) => set("parking", v)}
        />
        <EnumField
          label={t("villas.kitchen")}
          value={value.kitchen}
          unsetLabel={t("villas.unset")}
          options={VILLA_KITCHENS.map((id) => ({
            id,
            label: t(`villas.kitchen.${id}` as MessageKey),
          }))}
          onChange={(v) => set("kitchen", v)}
        />
        <EnumField
          label={t("villas.aircon")}
          value={value.aircon}
          unsetLabel={t("villas.unset")}
          options={VILLA_AIRCON.map((id) => ({
            id,
            label: t(`villas.aircon.${id}` as MessageKey),
          }))}
          onChange={(v) => set("aircon", v)}
        />
        <EnumField
          label={t("villas.view")}
          value={value.view}
          unsetLabel={t("villas.unset")}
          options={VILLA_VIEWS.map((id) => ({
            id,
            label: t(`villas.view.${id}` as MessageKey),
          }))}
          onChange={(v) => set("view", v)}
        />
        <TriField
          label={t("villas.wifi")}
          value={value.has_wifi}
          yes={t("villas.yes")}
          no={t("villas.no")}
          unset={t("villas.unset")}
          onChange={(v) => set("has_wifi", v)}
        />
        <TriField
          label={t("villas.pets")}
          value={value.pet_friendly}
          yes={t("villas.yes")}
          no={t("villas.no")}
          unset={t("villas.unset")}
          onChange={(v) => set("pet_friendly", v)}
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TriField({
  label,
  value,
  yes,
  no,
  unset,
  onChange,
}: {
  label: string;
  value: TriSelect;
  yes: string;
  no: string;
  unset: string;
  onChange: (value: TriSelect) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as TriSelect)}
      >
        <option value="">{unset}</option>
        <option value="yes">{yes}</option>
        <option value="no">{no}</option>
      </Select>
    </div>
  );
}

function EnumField<T extends string>({
  label,
  value,
  unsetLabel,
  options,
  onChange,
}: {
  label: string;
  value: "" | T;
  unsetLabel: string;
  options: { id: T; label: string }[];
  onChange: (value: "" | T) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value as "" | T)}
      >
        <option value="">{unsetLabel}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
