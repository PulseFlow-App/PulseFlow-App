"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { useData } from "@/lib/data/use-app-data";
import { canUseManagerReporting } from "@/lib/billing/reporting";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function ReportsEntryLink({
  villaId,
  className,
}: {
  villaId?: string | null;
  className?: string;
}) {
  const data = useData();
  const { t } = useI18n();
  const allowed = data.profile
    ? canUseManagerReporting({
        role: data.profile.role,
        orgKind: data.orgKind,
        organization: data.organization,
      })
    : false;
  if (!allowed) return null;
  const href = villaId
    ? `/reports?villa=${encodeURIComponent(villaId)}`
    : "/reports";
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1 rounded-[var(--radius-pill)]",
        "bg-sky/12 px-3 py-1.5 text-[11px] font-semibold text-sky",
        "shadow-[0_4px_12px_rgba(33,158,188,0.18)] transition",
        "hover:bg-sky/18 hover:text-sky active:scale-[0.98]",
        className,
      )}
    >
      <Download className="size-3.5" strokeWidth={2.25} />
      {t("reports.openFromHere")}
    </Link>
  );
}
