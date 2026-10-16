"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useI18n } from "@/lib/i18n/provider";
import { createClient, isDemoMode } from "@/lib/supabase/client";
import { DEMO_USER_COOKIE } from "@/lib/env";

export function DeleteAccountCard() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      if (isDemoMode()) {
        document.cookie = `${DEMO_USER_COOKIE}=; Max-Age=0; path=/`;
        router.replace("/login");
        return;
      }
      const res = await fetch("/api/account/delete", { method: "POST" });
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? t("common.error"));
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        open={open}
        title={t("settings.deleteAccountTitle")}
        description={t("settings.deleteAccountConfirm")}
        confirmLabel={t("settings.deleteAccount")}
        confirmVariant="danger"
        busy={busy}
        onConfirm={() => void runDelete()}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
      />
      <Card id="delete-account" className="scroll-mt-4 space-y-3 p-4 sm:p-5">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-ink">
            {t("settings.deleteAccount")}
          </h2>
          <p className="type-meta mt-1">{t("settings.deleteAccountHint")}</p>
        </div>
        {error ? (
          <p className="text-sm font-semibold text-danger">{error}</p>
        ) : null}
        <Button
          size="sm"
          variant="danger"
          className="w-full sm:w-auto"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          <Trash2 className="size-4" />
          {t("settings.deleteAccount")}
        </Button>
      </Card>
    </>
  );
}
