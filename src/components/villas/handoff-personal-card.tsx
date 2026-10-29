"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import type { VillaListItem } from "@/lib/types";

export function HandoffPersonalCard({
  personalVillas,
}: {
  personalVillas: VillaListItem[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [toEmail, setToEmail] = useState("");
  const [toFullName, setToFullName] = useState("");
  const [mode, setMode] = useState<"create" | "attach">("create");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  const allIds = useMemo(
    () => personalVillas.map((v) => v.id),
    [personalVillas],
  );

  if (personalVillas.length === 0) return null;

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    setLink(null);
    try {
      const res = await fetch("/api/handoff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villaIds: selected.length ? selected : allIds,
          toEmail: toEmail.trim(),
          toFullName: toFullName.trim() || undefined,
          createCompany: mode === "create",
          companyName: mode === "create" ? companyName.trim() : undefined,
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        handoffUrl?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? t("handoff.createError"));
      }
      setLink(payload.handoffUrl ?? null);
      setSelected([]);
      setToEmail("");
      setToFullName("");
      setCompanyName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("handoff.createError"));
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    toEmail.trim().includes("@") &&
    (mode === "attach" || companyName.trim().length > 0) &&
    (selected.length > 0 || allIds.length > 0);

  return (
    <Card className="space-y-3 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-ink">
            {t("handoff.title")}
          </h2>
          <p className="type-meta mt-1">{t("handoff.hint")}</p>
        </div>
        <Button
          size="sm"
          variant={open ? "ghost" : "secondary"}
          className="shrink-0"
          onClick={() => {
            setOpen((v) => !v);
            setError(null);
          }}
        >
          {open ? t("common.cancel") : t("handoff.open")}
        </Button>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-[var(--color-border)] pt-3">
          <div>
            <Label>{t("handoff.pickVillas")}</Label>
            <ul className="mt-2 space-y-1.5">
              {personalVillas.map((v) => {
                const on = selected.includes(v.id);
                return (
                  <li key={v.id}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(v.id)}
                        className="size-4 accent-[var(--color-primary)]"
                      />
                      <span className="font-semibold">{v.name}</span>
                      {v.area ? (
                        <span className="type-meta">· {v.area}</span>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="type-meta mt-1">{t("handoff.pickVillasHint")}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="handoff-email">{t("handoff.ownerEmail")}</Label>
              <Input
                id="handoff-email"
                type="email"
                autoComplete="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="handoff-name">{t("handoff.ownerName")}</Label>
              <Input
                id="handoff-name"
                value={toFullName}
                onChange={(e) => setToFullName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "create" ? "secondary" : "ghost"}
              onClick={() => setMode("create")}
            >
              {t("handoff.modeCreate")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "attach" ? "secondary" : "ghost"}
              onClick={() => setMode("attach")}
            >
              {t("handoff.modeAttach")}
            </Button>
          </div>

          {mode === "create" ? (
            <div>
              <Label htmlFor="handoff-company">{t("handoff.companyName")}</Label>
              <Input
                id="handoff-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1"
                placeholder={t("handoff.companyNamePh")}
              />
            </div>
          ) : (
            <p className="type-meta">{t("handoff.modeAttachHint")}</p>
          )}

          <Button
            className="w-full"
            disabled={busy || !canSubmit}
            onClick={() => void submit()}
          >
            {busy ? t("common.saving") : t("handoff.send")}
          </Button>

          {error ? (
            <p className="text-sm font-semibold text-danger">{error}</p>
          ) : null}
          {link ? (
            <div className="space-y-1 rounded-[var(--radius-md)] bg-secondary-soft/50 p-3">
              <p className="text-sm font-semibold text-ink">
                {t("handoff.linkReady")}
              </p>
              <p className="break-all text-xs text-muted">{link}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void navigator.clipboard.writeText(link)}
              >
                {t("common.copy")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
