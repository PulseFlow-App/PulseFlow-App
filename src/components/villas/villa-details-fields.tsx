"use client";

import { Input, Label } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  PROPERTY_TYPES,
  VILLA_AIRCON,
  VILLA_KITCHENS,
  VILLA_PARKING,
  VILLA_SETTINGS,
  VILLA_VIEWS,
  type TriSelect,
  type VillaDetailsForm,
} from "@/lib/villas/property-details";

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const BATHROOM_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6] as const;
const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16] as const;
const FLOOR_OPTIONS = [1, 2, 3, 4, 5] as const;

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
        {t("villas.detailsHint") ? (
          <p className="text-xs text-muted">{t("villas.detailsHint")}</p>
        ) : null}
      </div>

      <ChipEnumField
        label={t("villas.propertyType")}
        value={value.property_type}
        unsetLabel={t("villas.unset")}
        options={PROPERTY_TYPES.map((id) => ({
          id,
          label: t(`villas.propertyType.${id}` as MessageKey),
        }))}
        onChange={(v) => set("property_type", v)}
      />

      <div className="min-w-0">
        <Label>{t("villas.sqm")}</Label>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={value.sq_m}
          onChange={(e) => set("sq_m", e.target.value)}
        />
      </div>

      <CountChipField
        label={t("villas.bedrooms")}
        value={value.bedrooms}
        options={BEDROOM_OPTIONS}
        onChange={(v) => set("bedrooms", v)}
      />
      <CountChipField
        label={t("villas.bathrooms")}
        value={value.bathrooms}
        options={BATHROOM_OPTIONS}
        onChange={(v) => set("bathrooms", v)}
      />
      <CountChipField
        label={t("villas.maxGuests")}
        value={value.max_guests}
        options={GUEST_OPTIONS}
        onChange={(v) => set("max_guests", v)}
      />
      <CountChipField
        label={t("villas.floors")}
        value={value.floors}
        options={FLOOR_OPTIONS}
        onChange={(v) => set("floors", v)}
      />

      <ChipEnumField
        label={t("villas.setting")}
        value={value.setting}
        unsetLabel={t("villas.unset")}
        options={VILLA_SETTINGS.map((id) => ({
          id,
          label: t(`villas.setting.${id}` as MessageKey),
        }))}
        onChange={(v) => set("setting", v)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TriChipField
          label={t("villas.pool")}
          value={value.has_pool}
          yes={t("villas.yes")}
          no={t("villas.no")}
          unset={t("villas.unset")}
          onChange={(v) => set("has_pool", v)}
        />
        <TriChipField
          label={t("villas.garden")}
          value={value.has_garden}
          yes={t("villas.yes")}
          no={t("villas.no")}
          unset={t("villas.unset")}
          onChange={(v) => set("has_garden", v)}
        />
        <ChipEnumField
          label={t("villas.parking")}
          value={value.parking}
          unsetLabel={t("villas.unset")}
          options={VILLA_PARKING.map((id) => ({
            id,
            label: t(`villas.parking.${id}` as MessageKey),
          }))}
          onChange={(v) => set("parking", v)}
        />
        <ChipEnumField
          label={t("villas.kitchen")}
          value={value.kitchen}
          unsetLabel={t("villas.unset")}
          options={VILLA_KITCHENS.map((id) => ({
            id,
            label: t(`villas.kitchen.${id}` as MessageKey),
          }))}
          onChange={(v) => set("kitchen", v)}
        />
        <ChipEnumField
          label={t("villas.aircon")}
          value={value.aircon}
          unsetLabel={t("villas.unset")}
          options={VILLA_AIRCON.map((id) => ({
            id,
            label: t(`villas.aircon.${id}` as MessageKey),
          }))}
          onChange={(v) => set("aircon", v)}
        />
        <ChipEnumField
          label={t("villas.view")}
          value={value.view}
          unsetLabel={t("villas.unset")}
          options={VILLA_VIEWS.map((id) => ({
            id,
            label: t(`villas.view.${id}` as MessageKey),
          }))}
          onChange={(v) => set("view", v)}
        />
        <TriChipField
          label={t("villas.wifi")}
          value={value.has_wifi}
          yes={t("villas.yes")}
          no={t("villas.no")}
          unset={t("villas.unset")}
          onChange={(v) => set("has_wifi", v)}
        />
        <TriChipField
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

function CountChipField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly number[];
  onChange: (value: string) => void;
}) {
  const selected = value.trim();
  const known = options.some((n) => String(n) === selected);
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((n) => {
          const id = String(n);
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(active ? "" : id)}
              className={cn(
                "min-w-9 rounded-full px-3 py-1.5 text-sm font-semibold transition",
                active
                  ? "bg-primary text-white"
                  : "bg-canvas-deep text-ink hover:bg-sky/20",
              )}
              aria-pressed={active}
            >
              {id}
            </button>
          );
        })}
      </div>
      {selected && !known ? (
        <p className="mt-1 text-xs text-muted">{selected}</p>
      ) : null}
    </div>
  );
}

function TriChipField({
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
  const options: { id: TriSelect; label: string }[] = [
    { id: "", label: unset },
    { id: "yes", label: yes },
    { id: "no", label: no },
  ];
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id || "unset"}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold transition",
                active
                  ? "bg-primary text-white"
                  : "bg-canvas-deep text-ink hover:bg-sky/20",
              )}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChipEnumField<T extends string>({
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
    <div className="min-w-0">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-semibold transition",
            value === ""
              ? "bg-primary text-white"
              : "bg-canvas-deep text-ink hover:bg-sky/20",
          )}
          aria-pressed={value === ""}
        >
          {unsetLabel}
        </button>
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(active ? "" : opt.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold transition",
                active
                  ? "bg-primary text-white"
                  : "bg-canvas-deep text-ink hover:bg-sky/20",
              )}
              aria-pressed={active}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
