"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { useData } from "@/lib/data/use-app-data";
import { canUseManagerReporting } from "@/lib/billing/reporting";
import { useI18n } from "@/lib/i18n/provider";

export function ReportsEntryLink({
  villaId,
}: {
  villaId?: string | null;
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
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
    >
      <Download className="size-3.5" />
      {t("reports.openFromHere")}
    </Link>
  );
}
