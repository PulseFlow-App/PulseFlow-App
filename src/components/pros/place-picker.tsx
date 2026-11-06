"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { selectionTick } from "@/components/pros/haptics";
import { PfIcon } from "@/components/pros/pf-icons";
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
        "flex min-h-11 w-full items-center gap-2 text-start",
        nested ? "px-3 ps-6" : "px-3",
        selected ? "pf-choice-selected" : "pf-choice",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600",
      )}
    >
      <span className="min-w-0 flex-1 truncate text-pf-16 font-medium leading-snug text-pf-ink">
        {label}
      </span>
      {selected ? <Check className="size-4 shrink-0 text-pf-orange-500" aria-hidden /> : null}
    </button>
  );
}

export function PlacePicker({ variant = "bar" }: { variant?: "bar" | "pill" }) {
  const { state, t, setPlace } = usePros();
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const areas = allAreas(state).filter((area) => area.level === "locality" || area.level === "district");
  const islands = areas.filter((area) => area.level === "locality");
  const current = state.placeId ? areaName(state, state.placeId, locale) : t("any");

  const choose = (id: string | null) => {
    selectionTick();
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
          variant === "pill"
            ? "inline-flex h-11 min-w-0 max-w-full shrink items-center gap-1.5 overflow-hidden rounded-full bg-pf-card px-3 text-pf-14 font-medium text-pf-ink shadow-pf-1 ring-1 ring-pf-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600"
            : "relative inline-flex h-11 min-w-0 flex-1 items-center gap-1 rounded-full border border-pf-line bg-pf-card pe-2 ps-3 text-pf-14 font-medium text-pf-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pf-navy-600",
        )}
        aria-label={t("place")}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {variant === "pill" ? <PfIcon name="pin" className="size-4 shrink-0" /> : null}
        <span className="min-w-0 truncate text-start">{current}</span>
        {variant === "pill" ? null : <ChevronDown className="size-4 shrink-0 text-pf-slate-ink" aria-hidden />}
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
