"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";

export default function AssistantPage() {
  const { t } = usePros();
  const pathname = usePathname();

  return (
    <div className="space-y-3">
      <Link
        href={servicesPath(pathname, "/settings")}
        className="inline-flex min-h-11 items-center rounded-full border border-pf-line bg-pf-card px-3 text-pf-14 font-medium text-pf-ink"
      >
        {t("back")}
      </Link>
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("assistantTitle")}</h1>
      <p className="text-pf-16 leading-relaxed text-pf-text-secondary">{t("assistantBody")}</p>
    </div>
  );
}
