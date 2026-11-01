"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireUser } from "@/components/pros/parts";
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
  const { isAdmin } = usePros();
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

  if (!isAdmin) {
    return (
      <RequireUser account="app">
        <p className="text-sm text-muted">This panel is for platform admins.</p>
      </RequireUser>
    );
  }

  return (
    <RequireUser account="app">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink">Who invited whom</h1>
          <Link href={servicesPath(pathname, "/admin")} className="text-sm font-semibold text-primary">Back</Link>
        </div>
        <p className="text-sm text-muted">
          Marketing shares the general invite from Settings. The code after <span className="font-semibold text-ink">?from=</span> is that person’s share code. Company staff QR codes stay on the separate join link and are not listed as new companies here.
        </p>
        {liveNote ? <p className="text-sm text-muted">{liveNote}</p> : null}

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">On this device</h2>
          {localRows.length === 0 ? (
            <p className="text-sm text-muted">No registrations saved in this browser yet.</p>
          ) : (
            <ul className="space-y-2">
              {localRows.map((row) => (
                <li key={row.id} className="rounded-2xl bg-card p-3 text-sm">
                  <p className="font-semibold text-ink">{row.name}</p>
                  <p className="text-muted">{row.email} · {row.track}{row.plan === "company" ? ` · ${row.role}, ${row.payer} pays` : ""}</p>
                  <p className="text-muted">
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
            <h2 className="text-sm font-semibold text-ink">Live ledger</h2>
            <ul className="space-y-2">
              {liveRows.map((row) => (
                <li key={row.id} className="rounded-2xl bg-card p-3 text-sm">
                  <p className="font-semibold text-ink">{row.referrer} invited {row.referred}</p>
                  <p className="text-muted">
                    {row.referrerEmail ?? row.referrerCode} → {row.referredEmail}
                    {row.referredRole ? ` · ${row.referredRole}` : ""} · {row.source}
                  </p>
                  <p className="text-muted">{new Date(row.at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </RequireUser>
  );
}
