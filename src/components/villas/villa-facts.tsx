import { villaFactChips } from "@/lib/villas/property-details";
import { useI18n } from "@/lib/i18n/provider";
import type { VillaDetails } from "@/lib/types";

export function VillaFacts({
  villa,
  className = "mt-2",
}: {
  villa: VillaDetails;
  className?: string;
}) {
  const { t } = useI18n();
  const chips = villaFactChips(villa, t);
  if (!chips.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {chips.map((chip) => (
        <li
          key={chip}
          className="rounded-full bg-[#F0EDE6] px-2.5 py-1 text-[11px] font-semibold text-ink"
        >
          {chip}
        </li>
      ))}
    </ul>
  );
}
