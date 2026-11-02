"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { areaName, categoryName, responseMinutes } from "@/lib/pros/matching";
import { servicesPath } from "@/lib/pros/paths";
import { usePros } from "@/lib/pros/store";
import { useI18n } from "@/lib/i18n/provider";

function AdminLock() {
  const [secret, setSecret] = useState("");
  const [word, setWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="mx-auto max-w-sm space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        void fetch("/api/admin/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ string: secret, word }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const payload = (await res.json()) as { error?: string };
              setError(payload.error ?? "Those credentials are not valid.");
              return;
            }
            setSecret("");
            setWord("");
            window.dispatchEvent(new Event("pros-admin"));
          })
          .catch(() => setError("Those credentials are not valid."))
          .finally(() => setSaving(false));
      }}
    >
      <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">Admin</h1>
      <p className="text-pf-14 text-pf-text-secondary">Enter the string and the word admin.</p>
      <div>
        <Label htmlFor="admin-string">String</Label>
        <Input
          id="admin-string"
          type="password"
          autoComplete="off"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="admin-word">Word</Label>
        <Input
          id="admin-word"
          type="password"
          autoComplete="off"
          value={word}
          onChange={(e) => setWord(e.target.value)}
        />
      </div>
      {error ? <p className="text-pf-14 font-medium text-pf-danger-ink">{error}</p> : null}
      <Button type="submit" className="min-h-12 w-full" busy={saving}>
        Unlock
      </Button>
    </form>
  );
}

export default function ProsAdminPage() {
  const { state, isAdmin, adminReady, t, setProfileStatus, setCheck, addCategory, addArea } = usePros();
  const { locale } = useI18n();
  const pathname = usePathname();
  const [trade, setTrade] = useState("");
  const [area, setArea] = useState("");
  if (!adminReady) return null;
  if (!isAdmin) return <AdminLock />;
  const active = state.profiles.filter((row) => row.status === "active");
  const completed = state.requests.filter((row) => row.status === "completed").length;
  const replies = state.requests
    .map((row) => responseMinutes(row, state.offers))
    .filter((n): n is number => n != null);
  const average = replies.length ? Math.round(replies.reduce((s, n) => s + n, 0) / replies.length) : null;
  const byTrade = new Map<string, number>();
  const byArea = new Map<string, number>();
  for (const pro of active) {
    for (const id of pro.categoryIds) byTrade.set(id, (byTrade.get(id) ?? 0) + 1);
    for (const id of pro.areaIds) byArea.set(id, (byArea.get(id) ?? 0) + 1);
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-pf-28 font-bold tracking-[-0.02em] text-pf-ink">{t("admin")}</h1>
          <Link href={servicesPath(pathname, "/admin/referrals")} className="text-pf-14 font-medium text-pf-text-secondary">
            Who invited whom
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-[20px] bg-pf-card p-3"><dt className="text-pf-slate-ink">{t("professionals")}</dt><dd className="text-xl font-semibold">{active.length}</dd></div>
          <div className="rounded-[20px] bg-pf-card p-3"><dt className="text-pf-slate-ink">{t("requests")}</dt><dd className="text-xl font-semibold">{state.requests.length}</dd></div>
          <div className="rounded-[20px] bg-pf-card p-3"><dt className="text-pf-slate-ink">{t("offers")}</dt><dd className="text-xl font-semibold">{state.offers.filter((o) => o.amount != null || o.message).length}</dd></div>
          <div className="rounded-[20px] bg-pf-card p-3"><dt className="text-pf-slate-ink">{t("completed")}</dt><dd className="text-xl font-semibold">{completed}</dd></div>
        </dl>
        <p className="text-pf-16 text-pf-ink">
          {t("responseTime")}: {average == null ? t("noneYet") : t("minutes", { count: average })}
        </p>
        <section>
          <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("byTrade")}</h2>
          <ul className="text-sm">
            {[...byTrade.entries()].map(([id, count]) => (
              <li key={id}>{categoryName(state, id, locale)} · {count}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("byArea")}</h2>
          <ul className="text-sm">
            {[...byArea.entries()].map(([id, count]) => (
              <li key={id}>{areaName(state, id, locale)} · {count}</li>
            ))}
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("professionals")}</h2>
          {state.profiles.map((pro) => (
            <div key={pro.id} className="space-y-2 rounded-[20px] border border-pf-line p-3">
              <Link href={servicesPath(pathname, `/p/${pro.id}`)} className="font-medium text-pf-ink">{pro.name}</Link>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" reflectGlobalBusy={false} onClick={() => setProfileStatus(pro.id, pro.status === "suspended" ? "active" : "suspended")}>
                  {pro.status === "suspended" ? t("restore") : t("suspend")}
                </Button>
                {([
                  ["email", "emailVerified"],
                  ["phone", "phoneVerified"],
                  ["identity", "identityChecked"],
                  ["business", "businessChecked"],
                  ["qualification", "qualificationChecked"],
                ] as const).map(([check, label]) => (
                  <Button key={check} type="button" variant="ghost" reflectGlobalBusy={false} onClick={() => setCheck(pro.id, check, !pro.checks[check])}>
                    {t(label)}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </section>
        <section className="space-y-2">
          <h2 className="text-pf-22 font-bold tracking-[-0.02em] text-pf-ink">{t("reports")}</h2>
          {state.reports.length === 0 ? <p className="text-pf-14 text-pf-text-secondary">{t("noReports")}</p> : null}
          {state.reports.map((row) => (
            <p key={row.id} className="text-sm">{row.reason}</p>
          ))}
        </section>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addCategory(trade); setTrade(""); }}>
          <Input value={trade} onChange={(e) => setTrade(e.target.value)} placeholder={t("addCategory")} aria-label={t("addCategory")} />
          <Button type="submit" reflectGlobalBusy={false}>{t("addCategory")}</Button>
        </form>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addArea(area, state.placeId); setArea(""); }}>
          <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder={t("addArea")} aria-label={t("addArea")} />
          <Button type="submit" reflectGlobalBusy={false}>{t("addArea")}</Button>
        </form>
      </div>
  );
}
