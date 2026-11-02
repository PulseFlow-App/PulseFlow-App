"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { readSignups, type SignupRow } from "@/lib/pros/join";

type LiveRow = {
  id: string;
  at: string;
  source: string;
  referrer: string;
  referrerEmail: string | null;
  referrerCode: string | null;
  referred: string;
  referredEmail: string | null;
  referredRole: string | null;
};

export default function ReferralAdminPage() {
  const { isAdmin, adminReady } = usePros();
  const pathname = usePathname();
  const [localRows, setLocalRows] = useState<SignupRow[]>([]);
  const [liveRows, setLiveRows] = useState<LiveRow[]>([]);
  const [liveNote, setLiveNote] = useState<string | null>(null);

  useEffect(() => {
    setLocalRows(readSignups());
    void fetch("/api/admin/referrals")
      .then(async (res) => {
        const payload = (await res.json()) as { rows?: LiveRow[]; error?: string; demo?: boolean };
        if (payload.demo) {
          setLiveNote("This browser is in demo mode. Names below are saved on this device. The live ledger appears here once the database is connected.");
          return;
        }
        if (!res.ok) {
          setLiveNote(payload.error ?? "The live ledger is available to platform admins.");
          return;
        }
        setLiveRows(payload.rows ?? []);
      })
      .catch(() => setLiveNote("The live ledger could not be loaded."));
  }, []);

  if (!adminReady) return null;
  if (!isAdmin) {
    return <p className="text-pf-14 text-pf-text-secondary">This panel is locked.</p>;
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">Who invited whom</h1>
          <Link href={servicesPath(pathname, "/admin")} className="text-pf-14 font-medium text-pf-text-secondary">Back</Link>
        </div>
        <p className="text-pf-14 text-pf-text-secondary">
          Marketing shares the general invite from Settings. The code after <span className="font-medium text-pf-ink">?from=</span> is that person’s share code. Company staff QR codes stay on the separate join link and are not listed as new companies here.
        </p>
        {liveNote ? <p className="text-pf-14 text-pf-text-secondary">{liveNote}</p> : null}

        <section className="space-y-2">
          <h2 className="text-pf-14 font-medium text-pf-ink">On this device</h2>
          {localRows.length === 0 ? (
            <p className="text-pf-14 text-pf-text-secondary">No registrations saved in this browser yet.</p>
          ) : (
            <ul className="space-y-2">
              {localRows.map((row) => (
                <li key={row.id} className="rounded-[20px] bg-pf-card p-3 text-sm">
                  <p className="font-medium text-pf-ink">{row.name}</p>
                  <p className="text-pf-slate-ink">{row.email} · {row.track}{row.plan === "company" ? ` · ${row.role}, ${row.payer} pays` : ""}</p>
                  <p className="text-pf-slate-ink">
                    {row.referrer ? `Invited with code ${row.referrer}` : "No invite code"}
                    {" · "}
                    {new Date(row.at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {liveRows.length ? (
          <section className="space-y-2">
            <h2 className="text-pf-14 font-medium text-pf-ink">Live ledger</h2>
            <ul className="space-y-2">
              {liveRows.map((row) => (
                <li key={row.id} className="rounded-[20px] bg-pf-card p-3 text-sm">
                  <p className="font-medium text-pf-ink">{row.referrer} invited {row.referred}</p>
                  <p className="text-pf-slate-ink">
                    {row.referrerEmail ?? row.referrerCode} → {row.referredEmail}
                    {row.referredRole ? ` · ${row.referredRole}` : ""} · {row.source}
                  </p>
                  <p className="text-pf-slate-ink">{new Date(row.at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
  );
}
