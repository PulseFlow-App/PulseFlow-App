"use client";

import { ProCard, ServicesAccountGate } from "@/components/pros/parts";
import { usePathname } from "next/navigation";
import { usePros } from "@/lib/pros/store";

export default function SavedProsPage() {
  const { state, actor, actorReady, t } = usePros();
  const pathname = usePathname();
  const ids = actor ? state.favourites[actor.id] ?? [] : [];
  const people = ids
    .map((id) => state.profiles.find((row) => row.id === id && row.status !== "suspended"))
    .filter((row) => row != null);

  return (
    <div className="space-y-3">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("favourites")}</h1>
      {actorReady && !actor ? (
        <>
          <p className="text-pf-16 text-pf-text-secondary">{t("savedEmpty")}</p>
          <ServicesAccountGate next={pathname} />
        </>
      ) : null}
      {actor && people.length === 0 ? <p className="text-pf-16 text-pf-text-secondary">{t("savedEmpty")}</p> : null}
      {people.map((pro) => (
        <ProCard key={pro.id} pro={pro} />
      ))}
    </div>
  );
}
