"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fingerprint } from "lucide-react";
import { PulseMark } from "@/components/brand/pulse-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/lib/i18n/provider";
import { useBrandName } from "@/lib/i18n/use-brand-name";
import {
  isPasskeyAvailable,
  passkeyErrorMessage,
  signInWithPasskey,
} from "@/lib/auth/passkeys";
import { isDemoMode, createClient } from "@/lib/supabase/client";
import { demoLogin, demoLogout } from "@/lib/demo/store";
import type { MessageKey } from "@/lib/i18n";
import { extractInviteToken } from "@/lib/billing/plans";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

const DEMO_PASSWORD = "TestPass123!";

const DEMO_ACCOUNTS: {
  role: "owner" | "employee" | "guest";
  email: string;
  labelKey: MessageKey;
}[] = [
  { role: "owner", email: "owner@pulseflow.site", labelKey: "auth.demoOwner" },
  {
    role: "employee",
    email: "employee@pulseflow.site",
    labelKey: "auth.demoEmployee",
  },
  {
    role: "guest",
    email: "guest@pulseflow.site",
    labelKey: "auth.demoGuest",
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
  const brandName = useBrandName();
  const [error, setError] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<"owner" | "employee" | "guest" | null>(
    null,
  );
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [passkeyReady, setPasskeyReady] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

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
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("demo")?.trim().toLowerCase();
    if (
      fromQuery === "owner" ||
      fromQuery === "employee" ||
      fromQuery === "guest"
    ) {
      setDemoRole(fromQuery);
      return;
    }
    setDemoRole(null);
    if (isDemoMode()) {
      demoLogout();
    }
  }, []);

  useEffect(() => {
    if (isDemoMode()) return;
    void isPasskeyAvailable().then(setPasskeyReady);
  }, []);

  useEffect(() => {
    if (window.location.hash === "#invite") {
      document.getElementById("invite-join")?.scrollIntoView({ behavior: "smooth" });
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
      const useDemoSeat = isDemoMode() || Boolean(demoRole);

      if (useDemoSeat) {
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
      demoLogout();
      router.replace("/home");
      router.refresh();
    } catch {
      setError(t("common.error"));
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    await signIn(values.email, values.password);
  });

  const signInWithPasskeyClick = async () => {
    setError(null);
    setPasskeyLoading(true);
    try {
      await signInWithPasskey();
      router.replace("/home");
      router.refresh();
    } catch (e) {
      setError(passkeyErrorMessage(e, t));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const selectDemoRole = (role: "owner" | "employee" | "guest") => {
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
            <LanguageSwitcher variant="inline" />
          </div>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex justify-center">
              <PulseMark className="size-16" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
              {brandName}
            </h1>
            <p className="mt-2 text-sm text-muted">{t("brand.tagline")}</p>
          </div>

          <Card className="p-5">
            {isDemoPrefill ? (
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

            {passkeyReady ? (
              <div className="mb-4 space-y-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || passkeyLoading}
                  onClick={() => void signInWithPasskeyClick()}
                >
                  <Fingerprint className="size-5" aria-hidden />
                  {passkeyLoading
                    ? t("auth.signingInWithPasskey")
                    : t("auth.signInWithPasskey")}
                </Button>
                <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("auth.passkeyDivider")}
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

            <div
              id="invite-join"
              className="mt-5 border-t border-black/5 pt-4"
            >
              <p className="text-sm font-semibold text-ink">
                {t("auth.invitedToTeam")}
              </p>
              <div className="mt-2 flex gap-2">
                <Input
                  value={inviteLink}
                  onChange={(e) => {
                    setInviteLink(e.target.value);
                    setInviteError(null);
                  }}
                  placeholder={t("auth.invitePlaceholder")}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const token = extractInviteToken(inviteLink);
                    if (!token) {
                      setInviteError(t("auth.inviteInvalid"));
                      return;
                    }
                    router.push(`/join/${token}`);
                  }}
                >
                  {t("auth.inviteOpen")}
                </Button>
              </div>
              {inviteError ? (
                <p className="mt-2 text-xs font-semibold text-danger">
                  {inviteError}
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
