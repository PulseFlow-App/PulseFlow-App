import type { Villa } from "@/lib/types";
import { mapsSearchUrl, type PlaceHit } from "@/lib/agent-chat/places";

export type AgentChip = { id: string; label: string };

export type AgentTurn = {
  text: string;
  chips?: AgentChip[];
  allowPhoto?: boolean;
};

export type VillaDraft = {
  name?: string;
  photo_url?: string | null;
  location_url?: string;
  area?: string;
  description?: string;
  details?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  max_guests?: number | null;
  aircon?: Villa["aircon"];
  parking?: Villa["parking"];
  view?: Villa["view"];
  has_garden?: boolean | null;
  has_wifi?: boolean | null;
  pet_friendly?: boolean | null;
  kitchen?: Villa["kitchen"];
  setting?: Villa["setting"];
  has_pool?: boolean | null;
};

export type VillaStep =
  | "name"
  | "photo"
  | "place"
  | "beds"
  | "baths"
  | "size"
  | "guests"
  | "aircon"
  | "parking"
  | "view"
  | "extras";

export type VillaIntake = {
  step: VillaStep;
  draft: VillaDraft;
  placeChoices?: PlaceHit[];
};

function chips(items: AgentChip[]): AgentChip[] {
  return items;
}

export function startVillaIntake(): { intake: VillaIntake; turn: AgentTurn } {
  return {
    intake: { step: "name", draft: {} },
    turn: {
      text: "Add a property — same intake as Connect your agent.\n\nWhat’s the name? (or a famous place, like “Villa Sila Koh Phangan”)",
    },
  };
}

function promptForStep(
  step: VillaStep,
  draft: VillaDraft,
): { intake: VillaIntake; turn: AgentTurn } {
  if (step === "beds") {
    return {
      intake: { step: "beds", draft },
      turn: {
        text: "Bedrooms?",
        chips: chips([
          { id: "beds:1", label: "1" },
          { id: "beds:2", label: "2" },
          { id: "beds:3", label: "3" },
          { id: "beds:4", label: "4" },
          { id: "beds:5", label: "5" },
          { id: "beds:6", label: "6+" },
          { id: "skip", label: "Skip" },
        ]),
      },
    };
  }
  if (step === "baths") {
    return {
      intake: { step: "baths", draft },
      turn: {
        text: "Bathrooms?",
        chips: chips([
          { id: "baths:1", label: "1" },
          { id: "baths:2", label: "2" },
          { id: "baths:3", label: "3" },
          { id: "baths:4", label: "4" },
          { id: "baths:5", label: "5+" },
          { id: "skip", label: "Skip" },
        ]),
      },
    };
  }
  if (step === "size") {
    return {
      intake: { step: "size", draft },
      turn: {
        text: "Size? (kept as a range in notes — not a square-metre number)",
        chips: chips([
          { id: "size:under150", label: "Under 150 m²" },
          { id: "size:150-300", label: "150–300 m²" },
          { id: "size:300-500", label: "300–500 m²" },
          { id: "size:over500", label: "Over 500 m²" },
          { id: "size:unsure", label: "Not sure" },
        ]),
      },
    };
  }
  if (step === "guests") {
    return {
      intake: { step: "guests", draft },
      turn: {
        text: "Guests?",
        chips: chips([
          { id: "guests:2", label: "2" },
          { id: "guests:4", label: "4" },
          { id: "guests:6", label: "6" },
          { id: "guests:8", label: "8" },
          { id: "guests:10", label: "10" },
          { id: "guests:12", label: "12+" },
          { id: "skip", label: "Skip" },
        ]),
      },
    };
  }
  if (step === "aircon") {
    return {
      intake: { step: "aircon", draft },
      turn: {
        text: "Air conditioning?",
        chips: chips([
          { id: "aircon:full", label: "All rooms" },
          { id: "aircon:partial", label: "Some rooms" },
          { id: "aircon:none", label: "None" },
          { id: "skip", label: "Skip" },
        ]),
      },
    };
  }
  if (step === "parking") {
    return {
      intake: { step: "parking", draft },
      turn: {
        text: "Parking?",
        chips: chips([
          { id: "parking:private", label: "Private" },
          { id: "parking:street", label: "Street" },
          { id: "parking:none", label: "None" },
          { id: "skip", label: "Skip" },
        ]),
      },
    };
  }
  if (step === "view") {
    return {
      intake: { step: "view", draft },
      turn: {
        text: "View?",
        chips: chips([
          { id: "view:sea", label: "Sea" },
          { id: "view:jungle", label: "Jungle" },
          { id: "view:pool", label: "Pool" },
          { id: "view:garden", label: "Garden" },
          { id: "view:mountain", label: "Mountain" },
          { id: "skip", label: "Skip" },
        ]),
      },
    };
  }
  return extrasTurn(draft);
}

function nextAfterPlace(draft: VillaDraft): { intake: VillaIntake; turn: AgentTurn } {
  return promptForStep("beds", draft);
}

function extrasTurn(draft: VillaDraft): { intake: VillaIntake; turn: AgentTurn } {
  const on = (key: keyof VillaDraft, label: string) =>
    draft[key] ? `✓ ${label}` : label;
  return {
    intake: { step: "extras", draft },
    turn: {
      text: "Anything else that’s true? Tap to toggle, then Done.",
      chips: chips([
        { id: "extra:garden", label: on("has_garden", "Garden") },
        { id: "extra:wifi", label: on("has_wifi", "Wi-Fi") },
        { id: "extra:pets", label: on("pet_friendly", "Pet friendly") },
        { id: "extra:kitchen", label: on("kitchen", "Full kitchen") },
        { id: "extra:standalone", label: on("setting", "Standalone") },
        { id: "extra:pool", label: on("has_pool", "Pool") },
        { id: "done", label: "Done — create" },
      ]),
    },
  };
}

export function villaCreateInput(draft: VillaDraft) {
  const name = draft.name?.trim();
  if (!name) throw new Error("Need a property name.");
  const location_url =
    draft.location_url?.trim() || mapsSearchUrl(name);
  const description = [draft.description, draft.details]
    .filter(Boolean)
    .join("\n\n")
    .trim();
  return {
    name,
    location_url,
    area: draft.area,
    description: description || undefined,
    photo_url: draft.photo_url ?? null,
    bedrooms: draft.bedrooms ?? null,
    bathrooms: draft.bathrooms ?? null,
    max_guests: draft.max_guests ?? null,
    aircon: draft.aircon ?? null,
    parking: draft.parking ?? null,
    view: draft.view ?? null,
    has_garden: draft.has_garden ?? null,
    has_wifi: draft.has_wifi ?? null,
    pet_friendly: draft.pet_friendly ?? null,
    kitchen: draft.kitchen ?? null,
    setting: draft.setting ?? null,
    has_pool: draft.has_pool ?? null,
  };
}

export async function continueVillaIntake(
  intake: VillaIntake,
  input: { text: string; photoUrl?: string | null; chipId?: string },
  lookup: (q: string) => Promise<PlaceHit[]>,
): Promise<{
  intake: VillaIntake | null;
  turn: AgentTurn;
  create?: VillaDraft;
}> {
  const text = input.text.trim();
  const chip = input.chipId ?? "";
  if (/^\/cancel$/i.test(text) || chip === "cancel") {
    return {
      intake: null,
      turn: { text: "Cancelled. Type / for commands." },
    };
  }

  if (intake.step === "name") {
    if (!text) {
      return {
        intake,
        turn: { text: "Send the property name, or a famous place to look up." },
      };
    }
    const looksLikePlace = text.split(/\s+/).length >= 2;
    if (looksLikePlace) {
      const places = await lookup(text);
      if (places.length === 1) {
        const p = places[0]!;
        return {
          intake: {
            step: "photo",
            draft: {
              name: text,
              location_url: p.mapsUrl,
              area: p.area ?? undefined,
              description: p.label,
            },
          },
          turn: {
            text: `Found ${p.label}${p.area ? ` · ${p.area}` : ""}.\nAdd a photo, or Skip.`,
            allowPhoto: true,
            chips: chips([{ id: "skip", label: "Skip photo" }]),
          },
        };
      }
      if (places.length > 1) {
        return {
          intake: {
            step: "place",
            draft: { name: text },
            placeChoices: places,
          },
          turn: {
            text: "Which place? Or paste a maps link.",
            chips: places.map((p, i) => ({
              id: `place:${i}`,
              label: p.area ? `${p.label} · ${p.area}` : p.label,
            })),
          },
        };
      }
    }
    return {
      intake: { step: "photo", draft: { name: text } },
      turn: {
        text: "Add a photo of the property, or Skip.",
        allowPhoto: true,
        chips: chips([{ id: "skip", label: "Skip photo" }]),
      },
    };
  }

  if (intake.step === "photo") {
    const draft: VillaDraft = {
      ...intake.draft,
      photo_url: input.photoUrl || intake.draft.photo_url,
    };
    if (draft.location_url) return nextAfterPlace(draft);
    return {
      intake: { step: "place", draft },
      turn: {
        text: "Paste a Google Maps link, or type a famous place to look up.",
      },
    };
  }

  if (intake.step === "place") {
    if (chip.startsWith("place:") && intake.placeChoices) {
      const i = Number(chip.slice(6));
      const p = intake.placeChoices[i];
      if (p) {
        return nextAfterPlace({
          ...intake.draft,
          location_url: p.mapsUrl,
          area: p.area ?? intake.draft.area,
          description: intake.draft.description ?? p.label,
        });
      }
    }
    if (/^https?:\/\//i.test(text)) {
      return nextAfterPlace({ ...intake.draft, location_url: text });
    }
    if (!text) {
      return {
        intake,
        turn: {
          text: "Paste a maps link, or type a famous place.",
          chips: intake.placeChoices?.map((p, i) => ({
            id: `place:${i}`,
            label: p.area ? `${p.label} · ${p.area}` : p.label,
          })),
        },
      };
    }
    const places = await lookup(text);
    if (places.length === 1) {
      const p = places[0]!;
      return nextAfterPlace({
        ...intake.draft,
        location_url: p.mapsUrl,
        area: p.area ?? undefined,
        description: p.label,
      });
    }
    if (places.length > 1) {
      return {
        intake: { ...intake, placeChoices: places },
        turn: {
          text: "Which one?",
          chips: places.map((p, i) => ({
            id: `place:${i}`,
            label: p.area ? `${p.label} · ${p.area}` : p.label,
          })),
        },
      };
    }
    return nextAfterPlace({
      ...intake.draft,
      location_url: mapsSearchUrl(text),
      area: text,
    });
  }

  if (chip === "skip") {
    const order: VillaStep[] = [
      "beds",
      "baths",
      "size",
      "guests",
      "aircon",
      "parking",
      "view",
      "extras",
    ];
    const i = order.indexOf(intake.step);
    const next = order[i + 1] ?? "extras";
    return promptForStep(next, intake.draft);
  }

  if (intake.step === "beds") {
    const n = chip.startsWith("beds:") ? Number(chip.slice(5)) : Number(text);
    return promptForStep("baths", {
      ...intake.draft,
      bedrooms: Number.isFinite(n) ? n : intake.draft.bedrooms,
    });
  }

  if (intake.step === "baths") {
    const n = chip.startsWith("baths:") ? Number(chip.slice(6)) : Number(text);
    return promptForStep("size", {
      ...intake.draft,
      bathrooms: Number.isFinite(n) ? n : intake.draft.bathrooms,
    });
  }

  if (intake.step === "size") {
    const map: Record<string, string> = {
      "size:under150": "under 150 m²",
      "size:150-300": "150–300 m²",
      "size:300-500": "300–500 m²",
      "size:over500": "over 500 m²",
    };
    const details =
      map[chip] ?? (chip === "size:unsure" ? undefined : text || undefined);
    return promptForStep("guests", { ...intake.draft, details });
  }

  if (intake.step === "guests") {
    const n = chip.startsWith("guests:") ? Number(chip.slice(7)) : Number(text);
    return promptForStep("aircon", {
      ...intake.draft,
      max_guests: Number.isFinite(n) ? n : intake.draft.max_guests,
    });
  }

  if (intake.step === "aircon") {
    const aircon =
      chip === "aircon:full" ||
      chip === "aircon:partial" ||
      chip === "aircon:none"
        ? (chip.slice(7) as Villa["aircon"])
        : intake.draft.aircon;
    return promptForStep("parking", { ...intake.draft, aircon });
  }

  if (intake.step === "parking") {
    const parking =
      chip === "parking:private" ||
      chip === "parking:street" ||
      chip === "parking:none"
        ? (chip.slice(8) as Villa["parking"])
        : intake.draft.parking;
    return promptForStep("view", { ...intake.draft, parking });
  }

  if (intake.step === "view") {
    const view = chip.startsWith("view:")
      ? (chip.slice(5) as Villa["view"])
      : intake.draft.view;
    return extrasTurn({ ...intake.draft, view });
  }

  if (intake.step === "extras") {
    if (chip === "done") {
      return {
        intake: null,
        turn: { text: `Creating ${intake.draft.name}…` },
        create: intake.draft,
      };
    }
    const draft = { ...intake.draft };
    if (chip === "extra:garden") draft.has_garden = draft.has_garden ? null : true;
    if (chip === "extra:wifi") draft.has_wifi = draft.has_wifi ? null : true;
    if (chip === "extra:pets") draft.pet_friendly = draft.pet_friendly ? null : true;
    if (chip === "extra:kitchen") draft.kitchen = draft.kitchen === "full" ? null : "full";
    if (chip === "extra:standalone") {
      draft.setting = draft.setting === "standalone" ? null : "standalone";
    }
    if (chip === "extra:pool") draft.has_pool = draft.has_pool ? null : true;
    return extrasTurn(draft);
  }

  return extrasTurn(intake.draft);
}
