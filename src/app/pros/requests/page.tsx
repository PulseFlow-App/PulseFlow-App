"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ServicesAccountGate } from "@/components/pros/parts";
import { statusKey } from "@/lib/pros/i18n";
import { usePros } from "@/lib/pros/store";

export default function RequestsPage() {
  const { state, actor, actorReady, t } = usePros();
  const pathname = usePathname();
  const mine = state.requests.filter((row) => row.createdBy === actor?.id);
  const hrefFor = (id: string) =>
    pathname.startsWith("/pros") ? `/pros/requests/${id}` : `/requests/${id}`;

  return (
    <div className="space-y-3">
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("requests")}</h1>
      {actorReady && !actor ? (
        <>
          <p className="text-pf-14 text-pf-text-secondary">{t("ordersEmpty")}</p>
          <ServicesAccountGate next={pathname} />
        </>
      ) : null}
      {actor && mine.length === 0 ? <p className="text-pf-14 text-pf-text-secondary">{t("emptyRequests")}</p> : null}
      {mine.map((row) => (
        <Link key={row.id} href={hrefFor(row.id)} className="block rounded-[20px] border border-pf-line bg-pf-card p-3">
          <p className="font-medium text-pf-ink">{row.title}</p>
          <p className="text-pf-14 text-pf-text-secondary">{t(statusKey(row.status))}</p>
        </Link>
      ))}
    </div>
  );
}
