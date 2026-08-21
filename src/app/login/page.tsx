"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PulseMark } from "@/components/brand/pulse-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { brand } from "@/lib/design-tokens";
import { isDemoMode, createClient } from "@/lib/supabase/client";
import { demoLogin } from "@/lib/demo/store";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

const DEMO_PASSWORD = "TestPass123!";

const DEMO_ACCOUNTS: {
  role: "owner" | "employee";
  email: string;
  labelKey: MessageKey;
}[] = [
  { role: "owner", email: "owner@pulseflow.site", labelKey: "auth.demoOwner" },
  {
    role: "employee",
    email: "employee@pulseflow.site",
    labelKey: "auth.demoEmployee",
  },
];

function demoAccountFromParam(demo: string | null) {
  if (!demo) return null;
  const key = demo.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((a) => a.role === key) ?? null;
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<"owner" | "employee" | null>(null);

  const demoAccount = demoAccountFromParam(demoRole);
  const isDemoPrefill = Boolean(demoAccount);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search)
      .get("demo")
      ?.trim()
      .toLowerCase();
    if (fromQuery === "owner" || fromQuery === "employee") {
      setDemoRole(fromQuery);
    }
  }, []);

  useEffect(() => {
    if (!demoAccount) {
      setValue("email", "");
      setValue("password", "");
      return;
    }
    setValue("email", demoAccount.email);
    setValue("password", DEMO_PASSWORD);
  }, [demoAccount, setValue]);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      if (isDemoMode()) {
        const profile = demoLogin(email, password);
        if (!profile) {
          setError(t("auth.invalidCredentials"));
          return;
        }
        router.replace("/home");
        router.refresh();
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.replace("/home");
      router.refresh();
    } catch {
      setError(t("common.error"));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    await signIn(values.email, values.password);
  });

  const selectDemoRole = (role: "owner" | "employee") => {
    setDemoRole(role);
    const url = new URL(window.location.href);
    url.searchParams.set("demo", role);
    window.history.replaceState({}, "", url.toString());
    const account = DEMO_ACCOUNTS.find((a) => a.role === role);
    if (account) {
      setValue("email", account.email);
      setValue("password", DEMO_PASSWORD);
    }
  };

  return (
    <div className="h-dvh overflow-x-hidden overflow-y-auto overscroll-contain bg-sand px-4 py-10">
      <div className="mx-auto flex min-h-full w-full max-w-md items-center">
        <div className="w-full animate-rise">
          <div className="mb-4 flex justify-end">
            <LanguageSwitcher compact />
          </div>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <PulseMark className="size-16" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
              {brand.name}
            </h1>
            <p className="mt-2 text-sm text-muted">{t("brand.tagline")}</p>
          </div>

          <Card className="p-5">
            {isDemoMode() && isDemoPrefill ? (
              <div className="mb-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("auth.demoAccounts")}
                </p>
                <div className="grid gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => selectDemoRole(account.role)}
                      className={
                        account.role === demoRole
                          ? "rounded-2xl bg-primary-soft px-3 py-3 text-left ring-2 ring-primary/30"
                          : "rounded-2xl bg-[#F7F5F1] px-3 py-3 text-left transition hover:bg-primary-soft"
                      }
                    >
                      <p className="text-sm font-bold text-ink">
                        {t(account.labelKey)}
                      </p>
                      <p className="text-xs text-muted">{account.email}</p>
                    </button>
                  ))}
                </div>
                <p className="text-center text-[11px] text-muted">
                  {t("auth.demoHint")}
                </p>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                />
              </div>
              <div>
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                />
              </div>
              {error ? (
                <p className="text-sm font-semibold text-danger">{error}</p>
              ) : null}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("auth.signingIn") : t("auth.login")}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted">
              {t("auth.noAccount")}{" "}
              <Link href="/register" className="font-semibold text-primary">
                {t("auth.register")}
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
