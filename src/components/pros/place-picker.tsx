"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { BottomSheet } from "@/components/welcome/bottom-sheet";
import { usePros } from "@/lib/pros/store";
import { allAreas, areaName, type AreaRef } from "@/lib/pros/matching";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function PlaceOption({
  label,
  selected,
  nested = false,
  onPick,
}: {
  label: string;
  selected: boolean;
  nested?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onPick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg py-1.5 text-start transition",
        nested ? "px-2.5 ps-6" : "px-2.5",
        selected ? "pf-choice-selected" : "pf-choice hover:border-sky/35",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      )}
    >
      <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold leading-snug text-ink">
        {label}
      </span>
      {selected ? <Check className="size-3.5 shrink-0 text-primary" aria-hidden /> : null}
    </button>
  );
}

export function PlacePicker() {
  const { state, t, setPlace } = usePros();
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const areas = allAreas(state).filter((area) => area.level === "locality" || area.level === "district");
  const islands = areas.filter((area) => area.level === "locality");
  const current = state.placeId ? areaName(state, state.placeId, locale) : t("any");

  const choose = (id: string | null) => {
    setPlace(id);
    setOpen(false);
  };

  const districtsOf = (island: AreaRef) => areas.filter((area) => area.parentId === island.id);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative inline-flex h-10 min-w-0 flex-1 items-center gap-1 rounded-full border border-[var(--color-border)] bg-card pe-2 ps-2.5 text-xs font-semibold text-ink sm:h-8 sm:w-auto sm:flex-none",
          "hover:bg-canvas-deep",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        )}
        aria-label={t("place")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate text-start">{current}</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted" aria-hidden />
      </button>
      <BottomSheet open={open} title={t("place")} onClose={() => setOpen(false)}>
        <ul className="space-y-1" role="listbox" aria-label={t("place")}>
          <li>
            <PlaceOption label={t("any")} selected={!state.placeId} onPick={() => choose(null)} />
          </li>
          {islands.map((island) => (
            <li key={island.id} className="space-y-1 pt-1">
              <PlaceOption
                label={areaName(state, island.id, locale)}
                selected={state.placeId === island.id}
                onPick={() => choose(island.id)}
              />
              {districtsOf(island).map((area) => (
                <PlaceOption
                  key={area.id}
                  nested
                  label={areaName(state, area.id, locale)}
                  selected={state.placeId === area.id}
                  onPick={() => choose(area.id)}
                />
              ))}
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}
