"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PulseMark } from "@/components/brand/pulse-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { createClient, isDemoMode } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";

export default function MergeProfilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const [ctx, setCtx] = useState<{
    email: string;
    orgName: string;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isDemoMode()) {
        if (!cancelled) {
          setLoadError(t("guest.mergeUnavailable"));
          setLoaded(true);
        }
        return;
      }
      try {
        const res = await fetch(
          `/api/auth/confirm-merge?token=${encodeURIComponent(token)}`,
        );
        const payload = (await res.json()) as {
          error?: string;
          email?: string;
          orgName?: string;
        };
        if (!res.ok) {
          throw new Error(payload.error ?? t("guest.mergeInvalid"));
        }
        if (!cancelled) {
          setCtx({
            email: payload.email ?? "",
            orgName: payload.orgName ?? "",
          });
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : t("guest.mergeInvalid"));
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  const confirm = async () => {
    setError(null);
    if (password.length < 6) {
      setError(t("guest.mergeNeedPassword"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/confirm-merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = (await res.json()) as {
        error?: string;
        email?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? t("common.error"));
      }
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (payload.email ?? ctx?.email ?? "").toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      router.replace("/home");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex h-dvh items-center justify-center overflow-y-auto bg-sand text-sm text-muted">
        {t("common.loading")}
      </div>
    );
  }

  if (loadError || !ctx) {
    return (
      <div className="flex h-dvh items-center justify-center overflow-y-auto bg-sand px-4">
        <Card className="w-full max-w-md space-y-3 p-6 text-center">
          <PulseMark className="mx-auto size-12" />
          <h1 className="font-display text-xl font-bold text-ink">
            {t("guest.mergeInvalidTitle")}
          </h1>
          <p className="text-sm text-muted">{loadError ?? t("guest.mergeInvalid")}</p>
          <Link href="/login" className="font-semibold text-primary">
            Back to sign in
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-x-hidden overflow-y-auto overscroll-contain bg-sand px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-md animate-rise">
        <div className="mb-6 text-center">
          <PulseMark className="mx-auto mb-3 size-12" />
          <h1 className="font-display text-2xl font-bold text-ink">
            {t("guest.mergeTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t("guest.mergeHint", { org: ctx.orgName, email: ctx.email })}
          </p>
        </div>

        <Card className="space-y-4 p-5">
          <div>
            <Label>{t("guest.mergePassword")}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <p className="text-sm font-semibold text-danger">{error}</p>
          ) : null}
          <Button
            className="w-full"
            size="lg"
            disabled={saving}
            onClick={() => void confirm()}
          >
            {saving ? t("guest.mergeConfirming") : t("guest.mergeConfirm")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
