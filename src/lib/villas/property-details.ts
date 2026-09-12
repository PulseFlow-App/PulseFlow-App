import type {
  Villa,
  VillaAircon,
  VillaDetails,
  VillaKitchen,
  VillaParking,
  VillaSetting,
  VillaView,
} from "@/lib/types";
import type { MessageKey } from "@/lib/i18n";

type TFn = (key: MessageKey, params?: Record<string, string | number>) => string;

export const EMPTY_VILLA_DETAILS: VillaDetails = {
  sq_m: null,
  bedrooms: null,
  bathrooms: null,
  max_guests: null,
  floors: null,
  has_pool: null,
  has_garden: null,
  pet_friendly: null,
  has_wifi: null,
  setting: null,
  parking: null,
  kitchen: null,
  aircon: null,
  view: null,
};

export const VILLA_SETTINGS: VillaSetting[] = ["community", "standalone"];
export const VILLA_PARKING: VillaParking[] = ["none", "street", "private"];
export const VILLA_KITCHENS: VillaKitchen[] = ["none", "basic", "full"];
export const VILLA_AIRCON: VillaAircon[] = ["none", "partial", "full"];
export const VILLA_VIEWS: VillaView[] = [
  "sea",
  "jungle",
  "pool",
  "garden",
  "mountain",
];

export type TriSelect = "" | "yes" | "no";

export type VillaDetailsForm = {
  sq_m: string;
  bedrooms: string;
  bathrooms: string;
  max_guests: string;
  floors: string;
  has_pool: TriSelect;
  has_garden: TriSelect;
  pet_friendly: TriSelect;
  has_wifi: TriSelect;
  setting: "" | VillaSetting;
  parking: "" | VillaParking;
  kitchen: "" | VillaKitchen;
  aircon: "" | VillaAircon;
  view: "" | VillaView;
};

export const EMPTY_VILLA_DETAILS_FORM: VillaDetailsForm = {
  sq_m: "",
  bedrooms: "",
  bathrooms: "",
  max_guests: "",
  floors: "",
  has_pool: "",
  has_garden: "",
  pet_friendly: "",
  has_wifi: "",
  setting: "",
  parking: "",
  kitchen: "",
  aircon: "",
  view: "",
};

function numOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function boolOrNull(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function formatQty(n: number) {
  return Number.isInteger(n) ? String(n) : String(n);
}

export function pickVillaDetails(
  input: Partial<VillaDetails> | null | undefined,
): VillaDetails {
  return {
    sq_m: numOrNull(input?.sq_m),
    bedrooms: numOrNull(input?.bedrooms),
    bathrooms: numOrNull(input?.bathrooms),
    max_guests: numOrNull(input?.max_guests),
    floors: numOrNull(input?.floors),
    has_pool: boolOrNull(input?.has_pool),
    has_garden: boolOrNull(input?.has_garden),
    pet_friendly: boolOrNull(input?.pet_friendly),
    has_wifi: boolOrNull(input?.has_wifi),
    setting: oneOf(input?.setting, VILLA_SETTINGS),
    parking: oneOf(input?.parking, VILLA_PARKING),
    kitchen: oneOf(input?.kitchen, VILLA_KITCHENS),
    aircon: oneOf(input?.aircon, VILLA_AIRCON),
    view: oneOf(input?.view, VILLA_VIEWS),
  };
}

export function normalizeVillaRow<T extends Villa>(villa: T): T {
  return { ...villa, ...pickVillaDetails(villa) };
}

function triFromBool(value: boolean | null): TriSelect {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

function triToBool(value: TriSelect): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function numToInput(value: number | null): string {
  return value == null ? "" : formatQty(value);
}

export function detailsToForm(
  details: Partial<VillaDetails> | null | undefined,
): VillaDetailsForm {
  const d = pickVillaDetails(details);
  return {
    sq_m: numToInput(d.sq_m),
    bedrooms: numToInput(d.bedrooms),
    bathrooms: numToInput(d.bathrooms),
    max_guests: numToInput(d.max_guests),
    floors: numToInput(d.floors),
    has_pool: triFromBool(d.has_pool),
    has_garden: triFromBool(d.has_garden),
    pet_friendly: triFromBool(d.pet_friendly),
    has_wifi: triFromBool(d.has_wifi),
    setting: d.setting ?? "",
    parking: d.parking ?? "",
    kitchen: d.kitchen ?? "",
    aircon: d.aircon ?? "",
    view: d.view ?? "",
  };
}

export function formToDetails(form: VillaDetailsForm): VillaDetails {
  return {
    sq_m: numOrNull(form.sq_m),
    bedrooms: numOrNull(form.bedrooms),
    bathrooms: numOrNull(form.bathrooms),
    max_guests: numOrNull(form.max_guests),
    floors: numOrNull(form.floors),
    has_pool: triToBool(form.has_pool),
    has_garden: triToBool(form.has_garden),
    pet_friendly: triToBool(form.pet_friendly),
    has_wifi: triToBool(form.has_wifi),
    setting: oneOf(form.setting, VILLA_SETTINGS),
    parking: oneOf(form.parking, VILLA_PARKING),
    kitchen: oneOf(form.kitchen, VILLA_KITCHENS),
    aircon: oneOf(form.aircon, VILLA_AIRCON),
    view: oneOf(form.view, VILLA_VIEWS),
  };
}

export function villaFactChips(villa: Pick<Villa, keyof VillaDetails>, t: TFn) {
  const chips: string[] = [];
  if (villa.sq_m != null) {
    chips.push(t("villas.sqmShort", { n: formatQty(villa.sq_m) }));
  }
  if (villa.bedrooms != null) {
    chips.push(
      t("villas.bedroomsShort", {
        n: formatQty(villa.bedrooms),
        count: villa.bedrooms,
      }),
    );
  }
  if (villa.bathrooms != null) {
    chips.push(
      t("villas.bathroomsShort", {
        n: formatQty(villa.bathrooms),
        count: villa.bathrooms,
      }),
    );
  }
  if (villa.max_guests != null) {
    chips.push(
      t("villas.maxGuestsShort", {
        n: formatQty(villa.max_guests),
        count: villa.max_guests,
      }),
    );
  }
  if (villa.floors != null) {
    chips.push(
      t("villas.floorsShort", {
        n: formatQty(villa.floors),
        count: villa.floors,
      }),
    );
  }
  if (villa.setting) {
    chips.push(t(`villas.setting.${villa.setting}` as MessageKey));
  }
  if (villa.has_pool === true) chips.push(t("villas.poolYes"));
  if (villa.has_pool === false) chips.push(t("villas.poolNo"));
  if (villa.has_garden === true) chips.push(t("villas.gardenYes"));
  if (villa.has_garden === false) chips.push(t("villas.gardenNo"));
  if (villa.parking) {
    chips.push(t(`villas.parking.${villa.parking}` as MessageKey));
  }
  if (villa.kitchen) {
    chips.push(t(`villas.kitchen.${villa.kitchen}` as MessageKey));
  }
  if (villa.aircon) {
    chips.push(t(`villas.aircon.${villa.aircon}` as MessageKey));
  }
  if (villa.view) {
    chips.push(t(`villas.view.${villa.view}` as MessageKey));
  }
  if (villa.has_wifi === true) chips.push(t("villas.wifiYes"));
  if (villa.has_wifi === false) chips.push(t("villas.wifiNo"));
  if (villa.pet_friendly === true) chips.push(t("villas.petsYes"));
  if (villa.pet_friendly === false) chips.push(t("villas.petsNo"));
  return chips;
}
