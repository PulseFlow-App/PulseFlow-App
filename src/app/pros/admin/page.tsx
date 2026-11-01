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
      className="mx-auto max-w-sm space-y-3"
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
      <h1 className="font-display text-2xl font-semibold text-ink">Admin</h1>
      <p className="text-sm text-muted">Enter the string and the word admin.</p>
      <div>
        <Label htmlFor="admin-string">String</Label>
        <Input
          id="admin-string"
          type="password"
          autoComplete="off"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="min-h-12"
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
          className="min-h-12"
        />
      </div>
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
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
          <h1 className="font-display text-2xl font-semibold text-ink">{t("admin")}</h1>
          <Link href={servicesPath(pathname, "/admin/referrals")} className="text-sm font-semibold text-primary">
            Who invited whom
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-card p-3"><dt className="text-muted">{t("professionals")}</dt><dd className="text-xl font-semibold">{active.length}</dd></div>
          <div className="rounded-2xl bg-card p-3"><dt className="text-muted">{t("requests")}</dt><dd className="text-xl font-semibold">{state.requests.length}</dd></div>
          <div className="rounded-2xl bg-card p-3"><dt className="text-muted">{t("offers")}</dt><dd className="text-xl font-semibold">{state.offers.filter((o) => o.amount != null || o.message).length}</dd></div>
          <div className="rounded-2xl bg-card p-3"><dt className="text-muted">{t("completed")}</dt><dd className="text-xl font-semibold">{completed}</dd></div>
        </dl>
        <p className="text-sm text-ink">
          {t("responseTime")}: {average == null ? t("noneYet") : t("minutes", { count: average })}
        </p>
        <section>
          <h2 className="text-sm font-semibold">{t("byTrade")}</h2>
          <ul className="text-sm">
            {[...byTrade.entries()].map(([id, count]) => (
              <li key={id}>{categoryName(state, id, locale)} · {count}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-sm font-semibold">{t("byArea")}</h2>
          <ul className="text-sm">
            {[...byArea.entries()].map(([id, count]) => (
              <li key={id}>{areaName(state, id, locale)} · {count}</li>
            ))}
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{t("professionals")}</h2>
          {state.profiles.map((pro) => (
            <div key={pro.id} className="space-y-2 rounded-2xl border border-[var(--color-border)] p-3">
              <Link href={servicesPath(pathname, `/p/${pro.id}`)} className="font-semibold text-ink">{pro.name}</Link>
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
          <h2 className="text-sm font-semibold">{t("reports")}</h2>
          {state.reports.length === 0 ? <p className="text-sm text-muted">{t("noReports")}</p> : null}
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
