"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useData } from "@/lib/data/use-app-data";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/design-tokens";

type CompanySeat = Extract<UserRole, "owner" | "manager">;

/** Personal workspace → company (90-day trial), seat Owner or Manager. */
export function UpgradeToCompanyCard() {
  const data = useData();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [seat, setSeat] = useState<CompanySeat | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = data.profile;
  if (!profile || data.orgKind !== "personal") return null;

  const submit = async () => {
    if (!seat) {
      setError(t("register.seatRequired"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { isDemoMode } = await import("@/lib/supabase/client");
      if (isDemoMode()) {
        const { demoUpgradeToCompany } = await import("@/lib/demo/store");
        demoUpgradeToCompany(profile, {
          role: seat,
          companyName: companyName.trim() || undefined,
        });
      } else {
        const res = await fetch("/api/org/upgrade-to-company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: seat,
            companyName: companyName.trim() || undefined,
          }),
        });
        const payload = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(payload.error ?? t("upgrade.companyError"));
        }
      }
      await data.refresh();
      setOpen(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("upgrade.companyError"),
      );
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="space-y-2 border-t border-black/5 pt-3">
        <p className="text-sm font-semibold text-ink">
          {t("upgrade.companyTitle")}
        </p>
        <p className="text-sm text-muted">{t("upgrade.companyHint")}</p>
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={() => setOpen(true)}
        >
          {t("upgrade.companyCta")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-black/5 pt-3">
      <p className="text-sm font-semibold text-ink">
        {t("upgrade.companyTitle")}
      </p>
      <p className="text-sm text-muted">{t("register.seatHint")}</p>
      <div className="grid gap-2">
        <SeatChoice
          title={t("register.seatOwner")}
          description={t("register.seatOwnerHint")}
          active={seat === "owner"}
          onClick={() => setSeat("owner")}
        />
        <SeatChoice
          title={t("register.seatManager")}
          description={t("register.seatManagerHint")}
          active={seat === "manager"}
          onClick={() => setSeat("manager")}
        />
      </div>
      <div>
        <Label>{t("upgrade.companyNameOptional")}</Label>
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder={data.orgName}
        />
      </div>
      {error ? (
        <p className="text-sm font-semibold text-danger">{error}</p>
      ) : null}
      <p className="text-xs text-muted">{t("upgrade.companyTrialNote")}</p>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          {t("common.cancel")}
        </Button>
        <Button
          className="flex-1"
          busy={busy}
          disabled={!seat}
          onClick={() => void submit()}
        >
          {t("upgrade.companyConfirm")}
        </Button>
      </div>
    </div>
  );
}

function SeatChoice({
  title,
  description,
  active,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-3 py-2.5 text-left transition",
        active
          ? "border-primary bg-primary/5"
          : "border-black/5 bg-canvas-deep",
      )}
    >
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-xs text-muted">{description}</p>
    </button>
  );
}
